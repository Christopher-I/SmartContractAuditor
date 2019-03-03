pragma solidity >=0.4.21 <0.6.0;

import "./others/Ownable.sol";
import "./others/SafeMath.sol";

contract OceanBounty is Ownable {

    ///@dev use of safemath
    using SafeMath for uint256;


    
    /// @dev constants
    int8 constant public WhitelistThreshold = 5;  
    int8 constant public BlacklistThreshold = -5; 
    int8 constant public PunishmentMultiplier = 5; 
    uint256 public noOfTracks; 

    
    /// @notice enums  
    enum TrackState { SANDBOX, WHITELIST, BLACKLIST} 
    enum TrackGenre {JAZZ, BLUES, ROCKNROLL, COUNTRY}    
    event VoteSuccessful (address userAddress, int8 trackgenre, int voteValue, int8 noOfVotesToday);
    event TrackCreationSuccessful (uint trackhash, address userAddress, int8 trackgenre, uint voteValue);  
    
    /// @notice structs 
    struct Track  {      
        int8 trackGenre;  
        int16 trackRating; 
        uint hash ;  
        TrackState trackState; 
        address [] vouches; 
        address [] rejects; 
        mapping(address => bool) userDidVote;
    }
    
   /// @notice details of each user and their history 
    struct User{
        int8 noOfVotesInDay;  
        uint256 vouchCredits; 
        uint256 rejectCredits; 
        address userAddress;        
    }

   /// @notice details of each genre 
    struct Genre{
        int8 totalVotes; 
        int8 averageScore; 
    }

    /// @notice mappings
    /// @notice mapping of all genre types and their scores
    /// @notice mapping storage of all tracks
    /// @notice mapping storage of all users
    /// @notice playlist mapping track hash to track
    /// @notice mapping to keep track if user ids in relation to their expiry time
    mapping (int8 => Genre) public genreRegistry; 
    mapping (uint => Track) public trackRegistry; 
    mapping (address => User) public userRegistry; 
    mapping (uint => Track) public playlist;  
    mapping (address => uint) public timeOfVoteExpiry;

    /// @notice ensure trackhash input is not 0
    /// @notice check if track has been created already
    /// @notice ensure genre input is valid
    /// @dev automatic vouch for track creation
    function proposeTrack(uint trackHash, int8 trackGenre)public{ 
        int8 maxNumberOfGenres = 3;

        
        require(trackHash != 0, 'please check track hash is not 0 and retry'); 
        require(trackRegistry[trackHash].hash == 0, 'this track hash has been used already please try again'); 
        require(trackGenre <= maxNumberOfGenres, 'please entere a valid genre number between 0 and 2'); //
        Track memory track ;  
        track.hash = trackHash;  
        track.trackGenre = trackGenre; 

        User memory user; 
        user.userAddress = msg.sender;  
        user.vouchCredits = 1; //
        userRegistry[msg.sender] = user;
        
        trackRegistry[trackHash] = track;
        updateuserAddressToVote(trackHash, 1,msg.sender); 
        noOfTracks = noOfTracks.add(1); 
        updateGenre(trackGenre); 
        updateNumberOfVotesPerDay(msg.sender);  

        emit TrackCreationSuccessful(trackHash, msg.sender,trackGenre, 1);  
    }


    /// @notice this function is used to create new users, which are neccesary to place votes
    /// @notice function create temporary instance of a new user 
    /// @notice define userAddress
    /// @notice store user information in registry 
    function createNewUser()public{ 
        User memory newUser; 
        newUser.userAddress = msg.sender; 
        userRegistry[msg.sender] = newUser;       
    }    
    
    
    /// @notice this function vouches or rejects the given track based on user vote 
    /// @notice create a temporary address instance for userAddress, this is declared this way so that the user ID can always be easily changed to a different type
    /// @notice retrieve track information from storage
    /// @notice ensure user is registered
    /// @notice ensure track is not BLACKLISTed
    /// @notice check if user has previously voted for this track
    /// @notice check if user has votes more than 10 times in a day
    /// @dev require didvouch param to be either equal to -1 or 1 to avoid excessive lines of code.(-1 = reject, 1= vouch). This code line can easliy be updated in future to allow more voting options

    function vouchOrReject(uint trackHash, int8 didVouch)public {        
        address userAddress = msg.sender; //
        Track storage track = trackRegistry[trackHash];
        uint8 enumBlacklistValue = 2;

        require(userRegistry[userAddress].userAddress != address(0),'user information is not in registry, please create new user'); 
        require(uint8(trackRegistry[trackHash].trackState) != enumBlacklistValue, 'selected track is BLACKLISTed');
        require(!track.userDidVote[userAddress], 'you have already voted on this track'); 
        require(updateNumberOfVotesPerDay(userAddress),'you have exceeded your number of votes for today, please try after 24hrs');
        require((didVouch == -1 || didVouch == 1 ), 'ensure that didvouch paramater is either -1 or 1'); 
        
        updateTrackRating(trackHash,didVouch);
        updateTrackState(trackHash,track.trackGenre); 
        updateCredits(trackHash,didVouch,userAddress);
        updateGenre(track.trackGenre); 
        track.userDidVote[userAddress] = true; 
        
        emit VoteSuccessful(userAddress,track.trackGenre, didVouch, userRegistry[userAddress].noOfVotesInDay); 
    }


    /// @notice function to updated genre registry and information
    /// @notice retrieve genre information from registry
    /// @notice increment genre score
    /// @notice update average score
    function updateGenre(int8 trackGenre)internal {
        Genre storage _genre = genreRegistry[trackGenre];
        _genre.totalVotes +=1;
        _genre.averageScore = int8(uint256(_genre.totalVotes).div(noOfTracks)); 
        }

    
    /// @notice internal function to update the TrackState of each track and user based on specified mechanics
    /// @notice retrieve track information from registry
    /// @notice check if WHITELISTing mechanics are met
    /// @notice update TrackState to WHITELIST
    /// @notice if WHITELISTed, save track to playlist
    /// @notice check if BLACKLISTing mechanics are met
    /// @notice update TrackState to BLACKLIST
    /// @notice call function to penalize vouches for BLACKLISTed tracks
    /// @notice if BLACKLISTed, then remove from registry
    /// @notice if BLACKLISTed, delet from playlist
    /// @noticereduce number of track count
    /// @notice if non of the conditions are met, do nothing
    function updateTrackState(uint trackHash, int8 trackGenre)internal {
        Track storage track = trackRegistry[trackHash]; 
        
        if(uint8(track.trackState) == uint8 (TrackState.SANDBOX) && track.trackRating > WhitelistThreshold) { 
            uint8(track.trackState) == uint8(TrackState.WHITELIST); 
            playlist[trackHash] = track;  
            applyWhitelistPenalty(trackHash); 
        }else if(uint8(track.trackState) == uint8(TrackState.SANDBOX) && track.trackRating < BlacklistThreshold) { 
            uint8(track.trackState) == uint8(TrackState.BLACKLIST); 
            applyBlacklistPenalty(trackHash, trackGenre); 
            delete trackRegistry[trackHash]; 
            delete playlist[trackHash]; 
            noOfTracks.sub(1) ; 
        }
    }


    /// @notice penalize voters who rejected tracks that are WHITELISTed
    /// @notice retrieve track information from registry
    /// @notice retrieve track rating
    /// @notice calculate penalty score
    /// @notice create temporary address type of user ID
    /// @notice get the length of array containing the address of all users who voted reject on track
    /// @notice loop through all voters of reject and apply penalty
    /// @notice retrieve user ids
    /// @notice apply penalty 
    function applyWhitelistPenalty(uint trackHash)internal view{
        Track storage track = trackRegistry[trackHash]; 
        int16 _trackRating = track.trackRating; 
        int8 penalityScore = int8(uint256(_trackRating).sub(uint256(WhitelistThreshold))); 
        address _userAddress; 
        uint length = track.rejects.length; 
                
            for(uint i=0; i<length ; i++){ 
                _userAddress = track.rejects[i];
                userRegistry[_userAddress].vouchCredits.sub(uint256(penalityScore)); 
            }
            //return true;
        }    

    /// @notice penalize voters who vouched for tracks that are BLACKLISTed
    /// @notice retrieve track information from registered
    /// @notice retrieve genre average score
    /// @notice calculate penalty score
    /// @notice create temporary address type of user ID
    /// @notice get the length of array containing the address of all users who voted vouch on track
    /// @notice loop through all voters of vouch on the track and apply penalty
    /// @notice retrieve user id
    /// @notice apply penalty
    function applyBlacklistPenalty(uint trackHash, int8 _genre)internal returns(bool){
        Track storage track = trackRegistry[trackHash];  
        int8 _averageScore = genreRegistry[_genre].averageScore; 
        int8 penalityScore = int8(uint256(_averageScore).mul(uint256(PunishmentMultiplier)));  
        address _userAddress; 
        uint length = track.vouches.length;  
                
            for(uint i=0; i<length ; i++){  
                _userAddress = track.vouches[i];
               userRegistry[_userAddress].rejectCredits = userRegistry[_userAddress].rejectCredits.add(uint256(penalityScore));  
            }
            return true;
        }

    /// @notice function to update arrays within tracks that contain all user ids of all vouches and rejections
    /// @notice retrieve track information from register
    /// @notice update array of users who vouched for the track
    /// @notice update array of users who rejected the track
    function updateuserAddressToVote(uint trackHash, int8 didVouch,address userAddress)internal{        
        Track storage track = trackRegistry[trackHash]; 
        if(didVouch == 1){
            track.vouches.push(userAddress); 
        }
        else if(didVouch == -1){
            track.rejects.push(userAddress); 
        } 
    }    
    
    
    /// @notice this function assigns credits to users appropriately based on vote type(vouch/reject)
    /// @notice retrieve track information from registry
    /// @notice update average score
    function updateTrackRating(uint trackHash, int8 didVouch)internal{
        Track storage track = trackRegistry[trackHash]; 

        if(didVouch == 1){
        track.trackRating = int8(uint256(track.trackRating)+(uint256(didVouch))); 
        }
        else if(didVouch == -1){
        track.trackRating= int8(uint256(track.trackRating)-(uint256(1)));        
        } 
        }    
    
    
    /// @notice this function checks if user is allowed to vote based on daily vote limits 
    /// @notice check if its the first time the user is voting
    /// @notice set expiration time
    /// @notice increase the number of votes the user has made in a day
    /// @notice check if time is expired
    /// @notice expiration time is due, so reset expiration time
    /// @notice increment user votes in a day if expiration time is passed
    /// @notice check if user has exceeded number of allowed votes in a day
    /// @notice increment user votes in a day if less than limit
    function updateNumberOfVotesPerDay(address userAddress)internal returns (bool){
        int8 maxNoVotesInADay = 10;

        if (timeOfVoteExpiry[userAddress] == 0){ 
            timeOfVoteExpiry[userAddress] = now + 1 days;
            userRegistry[userAddress].noOfVotesInDay  = 1; 
            return true;            
       } else{
            uint expirationTime = timeOfVoteExpiry[userAddress];

            if (now < expirationTime && maxNoVotesInADay > userRegistry[userAddress].noOfVotesInDay){ 
                userRegistry[userAddress].noOfVotesInDay = int8(uint256(userRegistry[userAddress].noOfVotesInDay).add(uint256(1))); 
                return true; 
                
        }else{
        return false;
    }
          } 
    }      


    /// @notice this function updates all subsequent user credits based on vote type
    /// @notice retrieve track information from registry
    /// @notice if the vote is a reject, then loop through all previous rejects and increment all address with a reject credit of +1 
    /// @notice get array length of previous addressed who have voted reject   
    /// @notice retrieve user ids   
    /// @notice update all previous users with relevant reject credits
    /// @notice  update users reject credits
    /// @notice update vouch/reject array with users vote type
    /// @notice if the vote is a vouch, then loop through all previous vouches and increment all address with a vouch credit of +1 
    /// @notice get array length of previous addressed who have vouched   
    /// @notice retrieve user ids
    /// @notice update all previous users with relevant vouch credits
    /// @notice update users reject credits
    /// @notice update vouch/reject array with users vote type
    function updateCredits(uint trackHash, int8 didVouch, address userAddress)internal{       
        Track storage track = trackRegistry[trackHash];  
        User storage user = userRegistry[userAddress];
        address _userAddress;
        uint length;
        uint i;
        
        if (didVouch == -1){      
            length = track.rejects.length;          
            for(i=0; i<length ; i++){
                _userAddress = track.rejects[i];
                userRegistry[_userAddress].rejectCredits++;  
            }
            user.rejectCredits++; 
            updateuserAddressToVote(trackHash, didVouch,userAddress); 
        } 
        else if(didVouch == 1 ){   
            length = track.vouches.length; 
                
            for(i=0; i<length ; i++){
                _userAddress = track.vouches[i];
                userRegistry[_userAddress].vouchCredits++; 
            }
            user.vouchCredits++; 
            updateuserAddressToVote(trackHash, didVouch,userAddress); 
            } 
    }    
}
    
    
    
 

