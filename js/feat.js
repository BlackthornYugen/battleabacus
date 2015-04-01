/*globals $, Database*/

function Feat(id, name) {
    "use strict";
    this.id = id || 0;
    this.name = name || "Unnamed Feat";
}

Feat.DATA_URL = "https://localhost:444/feats_trimmed.json";//"http://node.steelcomputers.com:31338/feats.json";
Feat.TABLE_NAME = "Feats";

Feat.loadData = function () {
    "use strict";
    var featData, addItem, onSqlError;

    addItem = function (tx) {
        var feat = {};
        var x;

        for (x in featData) {
            feat[x] = featData[x].shift();
        }

        if (featData[x].length > 0) {
            tx.executeSql('INSERT INTO ' + Feat.TABLE_NAME +  ' VALUES (?, ?)',
                [feat.id, feat.name], addItem, onSqlError);
        }
    };

    onSqlError = function (tx, error) {
        if (error.message && error.message.match(/constraint failed/)) {
            console.error("ID already exists or is invalid");
        } else {
            console.error(error.message);
        }
        addItem(tx);
    };

    $.ajax({
        dataType: "json",
        url: Feat.DATA_URL,
        data: null,
        success: function (data) {
            featData = data;
            Database.transaction(function (tx) {
                addItem(tx);
            });
        }
    });
};

Feat.createTable = function (success) {
    "use strict";
    var createSpellsFailure, createSpellsTable;

    createSpellsFailure = function (tx, error) {
        if (error.message.indexOf("already exists") > 0) {
            Feat.dropTable(createSpellsTable);
            console.log("Rebuilding " + Feat.TABLE_NAME + " table.");
        } else {
            console.error(error.message);
        }
    };

    createSpellsTable = function (tx) {
        tx.executeSql('CREATE TABLE ' + Feat.TABLE_NAME +
            '(' +
            '  type_id INTEGER PRIMARY KEY,' +
            '  type_name varchar(50)' +
            ')', [], success, createSpellsFailure);
    };

    Database.transaction(createSpellsTable);
};

Feat.dropTable = function (next) {
    "use strict";
    Database.transaction(function (tx) {
        tx.executeSql('DROP TABLE ' + Feat.TABLE_NAME, [], next);
    });
};

/**
 * Count the number of records in the table
 * @param next Calls this with the number of records or with -1 on error.
 */
Feat.countRecords = function (next) {
    "use strict";
    var executeSql, afterSQL;
    var sql = 'SELECT COUNT(*) as count FROM ' + Feat.TABLE_NAME;

    executeSql = function (tx) {
        tx.executeSql(sql, [], afterSQL, afterSQL);
    };

    afterSQL = function (tx, response) {
        var count = -1;
        if (/SQLError/.test(response)) {
            console.error(response); // Got an SQL error, dump it to console.
        } else if (response.rows.length > 0) {
            count = response.rows.item(0).count;
        } else {
            console.error("The following statement yielded no results: \n" + sql);
        }
        next(count);
    };

    Database.transaction(executeSql);
};