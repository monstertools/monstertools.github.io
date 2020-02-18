let format = 'YYYY-MM-DD HH:mm:ss';

function strToDate(dateStr) {
    return moment(dateStr.replace('T', ' ').substr(0, 19), format).toDate();
}

function setDate() {
    $('#start_date').val(moment().add(-7, 'days').format(format));
    $('#end_date').val(moment().format(format));
}

function getDEC() {
    $('#tournaments_table').empty();
    $('#battles_table').empty();
    $('#rewards_table').empty();

    $('div#tournaments_total').text('Tournaments total: 0');
    $('div#battles_total').text('Battles total: 0');
    $('div#rewards_total').text('Quests total: 0');

    let player = $('#player').val();
    let startDate = moment($('#start_date').val(), format).toDate();
    let endDate = moment($('#end_date').val(), format).toDate();
    getDECfromTournaments(player, startDate, endDate);
    getDECfromBattles(player, startDate, endDate);
    getRewards(player, startDate, endDate);
}

function getDECfromTournaments(player, startDate, endDate) {
    let ids = [];
    let tournamentsTotal = 0;
    $.getJSON("https://api.steemmonsters.io/tournaments/completed?username=" + player, function (data) {
        if (!data) return;
        for (let i = 0; i < data.length; i++) {
            ids.push(data[i]['id']);
        }

        $('#tournaments_table').append( '<tr>' +
            '<th>Date</th>' +
            '<th>Tournament name</th>' +
            '<th>Position</th>' +
            '<th>Prize</th>' +
            '</tr>' );

        for (let i = 0; i < ids.length; i++) {
            let tid = ids[i];
            $.getJSON("https://api.steemmonsters.io/tournaments/find?id=" + tid, function (data2) {
                for (let j = 0; j <= data2['players'].length; j++) {
                    if (data2['players'][j] && data2['players'][j]['player'] === player && data2['players'][j]['prize']) {
                        let prize = parseFloat(data2['players'][j]['prize'].split(' ')[0]);

                        let tournamentStartDate = strToDate(data[i]['start_date']);

                        if (tournamentStartDate < startDate || tournamentStartDate > endDate) continue;

                        tournamentsTotal += prize;
                        $('span#tournaments_total').text((Math.round(tournamentsTotal * 1000) / 1000) + ' DEC');

                        $('#tournaments_table').append( '<tr>' +
                            '<td>' + moment(tournamentStartDate).format(format)  + '</td>' +
                            '<td>' + data[i]['name']  + '</td>' +
                            '<td>' + data2['players'][j]['finish']  + '</td>' +
                            '<td>' + data2['players'][j]['prize']  + '</td>' +
                            '</tr>' );
                    }
                }
            });
        }
    });
}

function getDECfromBattles(player, startDate, endDate) {
    let battlesTotal = 0;
    $.getJSON("https://api.steemmonsters.io/players/history?username=" + player + "&types=sm_battle", function (data) {
        if (!data) return;

        $('#battles_table').append( '<tr>' +
            '<th>Date</th>' +
            '<th>Ruleset</th>' +
            '<th>Manacap</th>' +
            '<th>DEC</th>' +
            '</tr>' );

        for (let i = 0; i < data.length; i++) {
            let createdDate = strToDate(data[i]['created_date']);

            if (createdDate < startDate || createdDate > endDate) continue;

            let res = JSON.parse(data[i]['result']);
            if (res['match_type'] === 'Ranked') {

                if (res['winner'] !== player) continue;

                battlesTotal += parseFloat(res['dec_info']['reward']);

                $('span#battles_total').text((Math.round(battlesTotal * 1000) / 1000) + ' DEC');

                $('#battles_table').append( '<tr>' +
                    '<td>' + moment(createdDate).format(format)  + '</td>' +
                    '<td>' + res['ruleset']  + '</td>' +
                    '<td>' + res['mana_cap']   + '</td>' +
                    '<td>' + res['dec_info']['reward']  + '</td>' +
                    '</tr>' );
            }
        }
        $('#battles_table').append( '<tr>' +
            '<td></td>' +
            '<td></td>' +
            '<td></td>' +
            '<td><b>' + (Math.round(battlesTotal * 1000) / 1000) + ' DEC' + '</b></td>' +
            '</tr>' );
    });
}

function getRewards(player, startDate, endDate) {

    let rewardDEC = {};
    rewardDEC[1] = 15;
    rewardDEC[2] = 60;
    rewardDEC[3] = 300;
    rewardDEC[4] = 1500;

    let totalCardsBurnValue = 0;
    let totalDec = 0;
    let totalAlchemyPotions = 0;
    let totalLegendaryPotions = 0;
    let totalOrbs = 0;

    let cardDetails = {};
    $.getJSON("https://steemmonsters.com/cards/get_details", function (data) {
        if (!data) return;
        for (let i = 0; i < data.length; i++) {
            let card = data[i];
            cardDetails[card['id']] = {'name': card['name'], 'rarity': card['rarity']};
        }

        $.getJSON("https://api.steemmonsters.io/players/history?username=" + player + "&types=claim_reward", function (data2) {
            if (!data2) return;

            $('#rewards_table').append( '<tr>' +
                '<th>Claim date</th>' +
                '<th>Cards burn value</th>' +
                '<th>DEC</th>' +
                '<th>Alchemy potions</th>' +
                '<th>Legendary potions</th>' +
                '<th>Orbs</th>' +
                '</tr>' );

            for (let i = 0; i < data2.length; i++) {
                if (!data2[i]) {
                    continue;
                }
                let createdDate = strToDate(data2[i]['created_date']);

                if (createdDate < startDate || createdDate > endDate) continue;

                let result = JSON.parse(data2[i]['result']);

                if (!result || !result['success']) {
                    continue;
                }

                let rewards = result['rewards'];

                let cardsBurnValue = 0;
                let dec = 0;
                let alchemyPotions = 0;
                let legendaryPotions = 0;
                let orbs = 0;

                for (let j = 0; j < rewards.length; j++) {

                    let reward = rewards[j];

                    if (reward['type'] === 'reward_card') {

                        if ('card' in reward) {
                            let rewardCard = reward['card'];
                            let cardDetailId = rewardCard['card_detail_id'];
                            let gold = rewardCard['gold'];
                            let card = cardDetails[cardDetailId];

                            let rarity = card['rarity'];
                            let d = rewardDEC[rarity];
                            if (gold) {
                                d *= 50;
                            }
                            cardsBurnValue += d;
                        } else if ('cards' in reward) {

                            for (let k = 0; k < reward['cards'].length; k++) {
                                let rewardCard = reward['cards'][k];
                                let cardDetailId = rewardCard['card_detail_id'];
                                let gold = rewardCard['gold'];
                                let card = cardDetails[cardDetailId];

                                let rarity = card['rarity'];
                                let d = rewardDEC[rarity];
                                if (gold) {
                                    d *= 50;
                                }
                                cardsBurnValue += d;
                            }
                        }

                    } else if (reward['type'] === 'potion') {
                        if (reward['potion_type'] === 'gold') {
                            alchemyPotions += reward['quantity'];
                        } else if (reward['potion_type'] === 'legendary') {
                            legendaryPotions += reward['quantity']
                        }
                    } else if (reward['type'] === 'dec') {
                        dec += reward['quantity'];
                    } else if (reward['type'] === 'pack') {
                        orbs += reward['quantity'];
                    }
                }

                totalCardsBurnValue += cardsBurnValue;
                totalDec += dec;
                totalAlchemyPotions += alchemyPotions;
                totalLegendaryPotions += legendaryPotions;
                totalOrbs += orbs;

                $('#rewards_table').append( '<tr>' +
                    '<td>' + moment(createdDate).format(format)  + '</td>' +
                    '<td>' + cardsBurnValue + ' DEC' + '</td>' +
                    '<td>' + dec + ' DEC' + '</td>' +
                    '<td>' + alchemyPotions + '</td>' +
                    '<td>' + legendaryPotions + '</td>' +
                    '<td>' + orbs + '</td>' +
                    '</tr>' );
            }

            $('#rewards_table').append( '<tr>' +
                '<td><b>Total</b></td>' +
                '<td><b>' + totalCardsBurnValue + ' DEC' + '</b></td>' +
                '<td><b>' + totalDec + ' DEC' + '</b></td>' +
                '<td><b>' + totalAlchemyPotions + '</b></td>' +
                '<td><b>' + totalLegendaryPotions + '</b></td>' +
                '<td><b>' + totalOrbs + '</b></td>' +
                '</tr>' );

            $('span#cards_total').text((Math.round(totalCardsBurnValue * 1000) / 1000) + ' DEC');
            $('span#dec_total').text(totalDec + ' DEC');
            $('span#alchemy_potions_total').text(totalAlchemyPotions);
            $('span#legendary_potions_total').text(totalLegendaryPotions);
            $('span#orbs_total').text(totalOrbs);
        });
    });
}
