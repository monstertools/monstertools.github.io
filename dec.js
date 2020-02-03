let format = 'YYYY-MM-DD HH:mm:ss';

function strToDate(dateStr) {
    return moment(dateStr.replace('T', ' ').substr(0, 19), format).toDate();
}

function getDEC() {
    $('#tournaments_table').empty();
    $('#battles_table').empty();
    $('#quests_table').empty();

    $('div#tournaments_total').text('Tournaments total: 0');
    $('div#battles_total').text('Battles total: 0');
    $('div#quests_total').text('Quests total: 0');

    let player = $('#player').val();
    let startDate = moment($('#start_date').val(), format).toDate();
    let endDate = moment($('#end_date').val(), format).toDate();
    getDECfromTournaments(player, startDate, endDate);
    getDECfromBattles(player, startDate, endDate);
    getDECfromQuests(player, startDate, endDate);
}

function getDECfromTournaments(player, startDate, endDate) {
    let ids = [];
    let tournamentsTotal = 0;
    $.getJSON("https://api.steemmonsters.io/tournaments/completed?username=" + player, function (data) {
        if (!data) return;
        for (let i = 0; i < data.length; i++) {
            ids.push(data[i]['id']);
        }
        for (let i = 0; i < ids.length; i++) {
            let tid = ids[i];
            $.getJSON("https://api.steemmonsters.io/tournaments/find?id=" + tid, function (data2) {
                for (let j = 0; j <= data2['players'].length; j++) {
                    if (data2['players'][j] && data2['players'][j]['player'] === player && data2['players'][j]['prize']) {
                        let prize = parseFloat(data2['players'][j]['prize'].split(' ')[0]);

                        let tournamentStartDate = strToDate(data[i]['start_date']);

                        if (tournamentStartDate < startDate || tournamentStartDate > endDate) continue;

                        tournamentsTotal += prize;
                        $('div#tournaments_total').text('Tournaments total: ' + (Math.round(tournamentsTotal * 1000) / 1000));

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
        for (let i = 0; i < data.length; i++) {
            let createdDate = strToDate(data[i]['created_date']);

            if (createdDate < startDate || createdDate > endDate) continue;

            let res = JSON.parse(data[i]['result']);
            if (res['match_type'] === 'Ranked') {

                if (res['winner'] !== player) continue;

                battlesTotal += parseFloat(res['dec_info']['reward']);

                $('div#battles_total').text('Battles total: ' + (Math.round(battlesTotal * 1000) / 1000));

                $('#battles_table').append( '<tr>' +
                    '<td>' + moment(createdDate).format(format)  + '</td>' +
                    '<td>' + res['ruleset']  + '</td>' +
                    '<td>' + res['mana_cap']   + '</td>' +
                    '<td>' + res['dec_info']['reward']  + '</td>' +
                    '</tr>' );
            }
        }
    });
}

function getDECfromQuests(player, startDate, endDate) {

    let rewardDEC = {};
    rewardDEC[1] = 15;
    rewardDEC[2] = 60;
    rewardDEC[3] = 300;
    rewardDEC[4] = 1500;

    let questsTotal = 0;
    let cardDetails = {};
    $.getJSON("https://steemmonsters.com/cards/get_details", function (data) {
        if (!data) return;
        for (let i = 0; i < data.length; i++) {
            let card = data[i];
            cardDetails[card['id']] = {'name': card['name'], 'rarity': card['rarity']};
        }

        $.getJSON("https://api.steemmonsters.io/players/history?username=" + player + "&types=sm_claim_reward", function (data2) {
            if (!data2) return;
            for (let i = 0; i < data2.length; i++) {
                let sum = 0;
                if (!data2[i]) {
                    continue;
                }
                let createdDate = strToDate(data2[i]['created_date']);

                if (createdDate < startDate || createdDate > endDate) continue;

                let result = JSON.parse(data2[i]['result']);

                for (let j = 0; j < result.length; j++) {
                    let cardDetailId = result[j]['card_detail_id'];
                    let gold = result[j]['gold'];
                    let card = cardDetails[cardDetailId];

                    let rarity = card['rarity'];
                    let dec = rewardDEC[rarity];
                    if (gold) {
                        dec *= 50;
                    }
                    sum += dec;
                }

                questsTotal += sum;
                $('div#quests_total').text('Rewards total: ' + (Math.round(questsTotal * 1000) / 1000));

                $('#quests_table').append( '<tr>' +
                    '<td>' + moment(createdDate).format(format)  + '</td>' +
                    '<td>' + sum + " DEC" + '</td>' +
                    '</tr>' );
            }
        });
    });
}
