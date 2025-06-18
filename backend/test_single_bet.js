const axios = require('axios');

async function testSingleBet() {
  try {
    console.log('🧪 Testing single bet placement...');
    
    // Test placing a single bet
    const response = await axios.post('http://localhost:3001/api/bets', {
      gameId: 1,
      prediction: 'HOME',
      amount: 50
    }, {
      headers: {
        'Authorization': 'Bearer demo_user_token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Single bet placed successfully:', response.data);
    
    // Now check if it appears in the games API
    console.log('\n🔍 Checking games API with betType=single...');
    const gamesResponse = await axios.get('http://localhost:3001/api/games/current-week?betType=single', {
      headers: {
        'Authorization': 'Bearer demo_user_token'
      }
    });
    
    const gamesWithBets = gamesResponse.data.games.filter(game => game.userBet);
    console.log('Games with userBet:', gamesWithBets.length);
    gamesWithBets.forEach(game => {
      console.log(`  Game ${game.id}: ${game.userBet.prediction}`);
    });
    
    // Check without betType filter
    console.log('\n🔍 Checking games API without betType filter...');
    const allGamesResponse = await axios.get('http://localhost:3001/api/games/current-week', {
      headers: {
        'Authorization': 'Bearer demo_user_token'
      }
    });
    
    const allGamesWithBets = allGamesResponse.data.games.filter(game => game.userBet);
    console.log('All games with userBet:', allGamesWithBets.length);
    allGamesWithBets.forEach(game => {
      console.log(`  Game ${game.id}: ${game.userBet.prediction}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSingleBet(); 