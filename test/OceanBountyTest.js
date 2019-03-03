const oceanBounty = artifacts.require('OceanBounty')

contract('oceanBounty', accounts => {

	let user0 = accounts[0]; let user1 = accounts[1]; let user2 = accounts[2];
    let user3 = accounts[3];  let user4 = accounts[4];  let user5 = accounts[5];
    let randomMaliciousUser = accounts[5]; 
    let trackHash1 = 1; let trackHash2 = 2; let trackHash3 = 3; let trackHash4 = 4; let trackHash5 = 5;
    let trackHash6 = 6; let trackHash7 = 7; let trackHash8 = 8; let trackHash9 = 9; let trackHash10 = 10;

    let jazz = 0; let blues = 1; let rocknroll = 2; let country = 3;
    let vouch= 1; let reject = -1; // 1 represents vouch, -1 represents reject
    


    beforeEach(async function() { 
        this.contract = await oceanBounty.new({from: user0})
        await this.contract.proposeTrack(trackHash1,jazz,{from: user1})
        await this.contract.createNewUser({from:accounts[0]}); await this.contract.createNewUser({from:accounts[1]});
        await this.contract.createNewUser({from:accounts[2]}); await this.contract.createNewUser({from:accounts[3]});
        await this.contract.createNewUser({from:accounts[4]}); await this.contract.createNewUser({from:accounts[5]});
        await this.contract.createNewUser({from:accounts[6]}); await this.contract.createNewUser({from:accounts[7]});
        await this.contract.createNewUser({from:accounts[8]}); await this.contract.createNewUser({from:accounts[9]});
      //  await this.contract.createNewUser({from:accounts[10]});         

    })

        describe('When new track is created, all relevant info stored in registry', () => { 

                it('can create a new track', async function () { 
                     tx = await this.contract.proposeTrack(trackHash2,jazz, {from: user1})
                     assert.equal(tx.logs[0].event, 'TrackCreationSuccessful') // confirm emitted event after storage 

                })

                it('all new tracks will enter a “sandbox registry” with a score of zero', async function () { 
                     let trackInfo = await this.contract.trackRegistry(trackHash1)
                     assert.equal(trackInfo.trackRating, 0) // confirm track rating in registry
                })

                it('track information is stored in registry', async function () { 
                     let trackInfo = await this.contract.trackRegistry(trackHash1)
                     assert.equal(trackInfo.hash, trackHash1) // confirm track is stored by searching for track using its hash
                })

                it('user information is stored in registry', async function () { 
                     let userInfo = await this.contract.userRegistry(user1)
                     assert.equal(userInfo.userAddress, user1) // confirm user info is stored by searching user registry with user id
                })

        })



        describe('For each song, users can vote either vouch or reject', () => { 

			    it('stores single user votes track registry', async function () { 
		             await this.contract.vouchOrReject(trackHash1,vouch, {from: user0})
		             var nofotracks = await this.contract.noOfTracks({from: user0})

		             let trackInfo = await this.contract.trackRegistry(trackHash1)
		             assert.equal(trackInfo.trackRating, vouch)		             

        })

			    it('user votes are irrevocably stored (the vote is locked) as part of each users account.', async function () { 
			    	 await this.contract.vouchOrReject(trackHash1,reject, {from: user1})

			    	 let userInfo = await this.contract.userRegistry(user1)
		             assert.equal(userInfo.rejectCredits, 1)	//

			    })
		})



		describe('Each track will display the current total number of votes (positive minus negative)', () => { 

			    it('track ratings are accurately calculated and stored in track registry.', async function () { 
		             await this.contract.vouchOrReject(trackHash1,reject, {from: user1})
		             await this.contract.vouchOrReject(trackHash1,vouch, {from: user2})
		             await this.contract.vouchOrReject(trackHash1,vouch, {from: user3})
		             await this.contract.vouchOrReject(trackHash1,reject, {from: user4})

		             let voteTotal = vouch + reject + vouch + reject
		             let trackInfo = await this.contract.trackRegistry(trackHash1)
		             assert.equal(trackInfo.trackRating, voteTotal)		             

        })

        })

        describe('For every similar vote (vouch or reject) after theirs, the user will get that vote as a credit point', () => { 

			    it('updates creators account with a vouch increment of 1, when track is created.', async function () { 
		             await this.contract.proposeTrack(trackHash2,jazz,{from: user2})

			    	 let userInfo = await this.contract.userRegistry(user2)
		             assert.equal(userInfo.vouchCredits, 1)  // new track created with user2, should have a vouch credit of 1
        })
			    	it('accurately calculates and increments creators account with vouch credits on subsequent vouches.', async function () { 
		             await this.contract.proposeTrack(trackHash2, jazz, {from: user2})
		             await this.contract.vouchOrReject(trackHash2,vouch, {from: user3})
		             await this.contract.vouchOrReject(trackHash2,vouch, {from: user4})

			    	 let userInfo = await this.contract.userRegistry(user2)//user0 created the contract, and 4 vouches have been made on same track
		             assert.equal(userInfo.vouchCredits, 3)  // with 3 additional vouches after track creation, total vouches should be 4           
        })

			    	it('accurately calculates and increments reject credits on subsequent rejects.', async function () { 
		             await this.contract.proposeTrack(trackHash2,jazz,{from: user2})
		             await this.contract.vouchOrReject(trackHash2,reject, {from: user3})
		             await this.contract.vouchOrReject(trackHash2,reject, {from: user4})
		             await this.contract.vouchOrReject(trackHash2,reject, {from: user5})

			    	 let userInfo = await this.contract.userRegistry(user3)//user0 created the contract, and 4 vouches have been made on same track
		             assert.equal(userInfo.rejectCredits, 3)  

        })
			    	})

			   

        describe('genre information updates accurately', () => { 

			    it('when a track is created, the genre score increments', async function () {
			    	let genreDetails = await this.contract.genreRegistry(blues)
			    	let prevGenreScore = genreDetails.totalVotes
		            await this.contract.proposeTrack(trackHash2,blues,{from: user2})

		             let genreDetails2 = await this.contract.genreRegistry(blues)
		             let currentGenreScore = genreDetails2.totalVotes
		             assert.equal(currentGenreScore ,(+prevGenreScore + 1))

		             console.log("genre score "+ await this.contract.genreRegistry(blues))

		         })


			    it('increments the genre score when a vouch is made', async function () {
			    	await this.contract.proposeTrack(trackHash3,rocknroll,{from: user2})
			    	let genreDetails = await this.contract.genreRegistry(rocknroll)
			    	let prevGenreScore = genreDetails.totalVotes
		            await this.contract.vouchOrReject(trackHash3,vouch, {from: user3})

		             let genreDetails2 = await this.contract.genreRegistry(rocknroll)
		             let currentGenreScore = genreDetails2.totalVotes
		             assert.equal(currentGenreScore ,(+prevGenreScore + 1))
		         })

			    it('increments the genre score when a reject is made', async function () {
			    	await this.contract.proposeTrack(trackHash2,country,{from: user2})
			    	let genreDetails = await this.contract.genreRegistry(country)
			    	let prevGenreScore = genreDetails.totalVotes 
		            await this.contract.vouchOrReject(trackHash2,reject, {from: user3})

		             genreDetails = await this.contract.genreRegistry(country)
		             let currentGenreScore = genreDetails.totalVotes
		             assert.equal(currentGenreScore ,(+prevGenreScore + 1))
		         })

		 })

		describe('each user can have a maximum of 10 votes per day', () => { 

			    it('does not throws an error with the same user on 10 tries, but throws on the 11th if tries are made within in a day' , async function () {
			   	await this.contract.proposeTrack(trackHash2,rocknroll,{from: user3})
            for(let i = 0; i < 10; i ++) { 
				await this.contract.vouchOrReject(i,vouch, {from: user2}) 
            }
            	
            	await expectThrow(this.contract.vouchOrReject(11,vouch, {from: user2}))// on the 11th try, expect error 


			})
			})


		describe('Once a song goes above or below (test treshhold = +/-5), it will be placed in the whitelist (main) playlist/ blacklist', () => { 

			it('whitelists track on playlist after 5 vouches' , async function () {
			   	await this.contract.proposeTrack(trackHash2,rocknroll,{from: user2})
            for(let i = 3; i < 9; i ++) { 
				await this.contract.vouchOrReject(trackHash2,vouch, {from: accounts[i]})   
            }
            	let _track = await this.contract.playlist(trackHash2);
            	//console.log(_track.hash);
            	await assert.equal(_track.hash, trackHash2);
			})

			it('blacklist and deletes track from registry after 5 rejects' , async function () {
			   	await this.contract.proposeTrack(trackHash2,rocknroll,{from: user2})
			   	let hashInRegistryBeforeBlacklist = await this.contract.trackRegistry(trackHash2)
			   	//console.log(hashInRegistryBeforeBlacklist.hash)
            for(let i = 3; i < 9; i ++) { 
				await this.contract.vouchOrReject(trackHash2,reject, {from: accounts[i]})   
            }
            	let hashInRegistryAfterBlacklist = await this.contract.trackRegistry(trackHash2)
            	//console.log(hashInRegistryAfterBlacklist.hash);
            	await assert(hashInRegistryBeforeBlacklist.hash > hashInRegistryAfterBlacklist.hash);
			})

			})




		describe('whitelists and blacklist penalties are applied', () => { 

				it('Proposers and users who voted vouch get a penalty of 5 x average score when their song gets rejected (blacklisted)' , async function () {
				   	await this.contract.proposeTrack(trackHash2,rocknroll,{from: user2})

	            for(let i = 3; i < 10; i ++) { 

					await this.contract.vouchOrReject(trackHash2,reject, {from: accounts[i]})   
	            }
	            	let genreDetails = await this.contract.genreRegistry(2);
				   	let _averageScore = genreDetails.averageScore;
				   	let penalityScore = _averageScore * (await this.contract.PunishmentMultiplier());
	            	let rejectCreditsAfterBlacklist = await this.contract.userRegistry(user2)
	            	await assert.equal(+rejectCreditsAfterBlacklist.rejectCredits, penalityScore)
			})


				it('Users who voted reject when the track gets whitelisted, get a penalty of the track rating minus WhitelistThreshold(+5)' , async function () {
				   	await this.contract.vouchOrReject(trackHash1,reject, {from: user2})

	            for(let i = 3; i < 9; i ++) { 

					await this.contract.vouchOrReject(trackHash1,vouch, {from: accounts[i]})   
	            }
	            	let trackInfo = await this.contract.trackRegistry(trackHash1)
	            	let trackRating = trackInfo.trackRating
	            	//console.log("trackRating"+ trackRating)
	            	let whitelistThreshold = await this.contract.WhitelistThreshold()
	            	//console.log("whitelistThreshold"+ whitelistThreshold)
	            	let penalityScore = trackRating - whitelistThreshold

				   	let vouchCreditsAfterWhitelist = await this.contract.userRegistry(user2)
				   	//console.log("penalty"+ penalityScore)
	            	//console.log("vouchcredits"+vouchCreditsAfterWhitelist.vouchCredits)

	            	await assert.equal(vouchCreditsAfterWhitelist.vouchCredits, -penalityScore)
			})


		})

	})




var expectThrow = async function(promise) { 
    try { 
        await promise
    } catch (error) { 
        assert.exists(error)
        return 
    }

    assert.fail('expected an error, but none was found')
}