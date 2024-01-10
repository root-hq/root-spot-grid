export type RootSpotGrid = {
  "version": "0.1.0",
  "name": "root_spot_grid",
  "instructions": [
    {
      "name": "initializeMarket",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "phoenixMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "protocolFeeRecipient",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "quoteTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "protocolFeePerFillBps",
          "type": "u16"
        },
        {
          "name": "minOrderSpacingInTicks",
          "type": "u64"
        },
        {
          "name": "minOrderSizeInBaseLots",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateMarket",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newProtocolFeePerFillBps",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "minOrderSpacingInTicks",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newMinOrderSizeInBaseLots",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "createPosition",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "phoenixMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "spotGridMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "positionKey",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tradeManager",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "logAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "seat",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "seatManager",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "seatDepositCollector",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "quoteTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenUserAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quoteTokenUserAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quoteTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "basePhoenixVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quotePhoenixVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "phoenixProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "phoenixSeatManagerProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "PositionArgs"
          }
        }
      ]
    },
    {
      "name": "cancelOrders",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "phoenixMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionKey",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tradeManager",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "logAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "quoteTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quoteTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "basePhoenixVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quotePhoenixVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "phoenixProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closePosition",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "phoenixMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionKey",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tradeManager",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "quoteTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenUserAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quoteTokenUserAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quoteTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "phoenixMarket",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "protocolFeeRecipient",
            "type": "publicKey"
          },
          {
            "name": "baseTokenMint",
            "type": "publicKey"
          },
          {
            "name": "quoteTokenMint",
            "type": "publicKey"
          },
          {
            "name": "protocolFeePerFillBps",
            "type": "u16"
          },
          {
            "name": "minOrderSpacingInTicks",
            "type": "u64"
          },
          {
            "name": "minOrderSizeInBaseLots",
            "type": "u64"
          },
          {
            "name": "claimedProtocolFeeInQuoteTokens",
            "type": "u64"
          },
          {
            "name": "unclaimedProtocolFeeInQuoteTokens",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "positionKey",
            "type": "publicKey"
          },
          {
            "name": "market",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "tradeManager",
            "type": "publicKey"
          },
          {
            "name": "positionArgs",
            "type": {
              "defined": "PositionArgs"
            }
          },
          {
            "name": "feeGrowthBase",
            "type": "u64"
          },
          {
            "name": "feeGrowthQuote",
            "type": "u64"
          },
          {
            "name": "activeOrders",
            "type": {
              "array": [
                {
                  "defined": "OrderParams"
                },
                15
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "OrderParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderSequenceNumber",
            "type": "u64"
          },
          {
            "name": "priceInTicks",
            "type": "u64"
          },
          {
            "name": "sizeInBaseLots",
            "type": "u64"
          },
          {
            "name": "isBid",
            "type": "bool"
          },
          {
            "name": "isNull",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "PositionArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mode",
            "type": {
              "defined": "Mode"
            }
          },
          {
            "name": "numGrids",
            "type": "u64"
          },
          {
            "name": "minPriceInTicks",
            "type": "u64"
          },
          {
            "name": "maxPriceInTicks",
            "type": "u64"
          },
          {
            "name": "orderSizeInBaseLots",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "DeserializedFIFOOrderId",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "priceInTicks",
            "type": "u64"
          },
          {
            "name": "orderSequenceNumber",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Mode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Arithmetic"
          },
          {
            "name": "Geometric"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPriceRange",
      "msg": "Invalid price range"
    },
    {
      "code": 6001,
      "name": "ExceededMaxNumGrids",
      "msg": "Exceeded number of grids limit"
    },
    {
      "code": 6002,
      "name": "InvalidOrderSize",
      "msg": "Order size less than minimum size required"
    },
    {
      "code": 6003,
      "name": "InvalidPhoenixProgram",
      "msg": "Phoenix program id invalid"
    },
    {
      "code": 6004,
      "name": "PhoenixMarketError",
      "msg": "Phoenix market deserialization error"
    },
    {
      "code": 6005,
      "name": "PhoenixVaultSeatRetired",
      "msg": "Phoenix vault seat Retired"
    },
    {
      "code": 6006,
      "name": "InvalidBaseLotSize",
      "msg": "Invalid base lot size"
    },
    {
      "code": 6007,
      "name": "PendingOpenOrders",
      "msg": "Pending open orders before closure"
    }
  ]
};

export const IDL: RootSpotGrid = {
  "version": "0.1.0",
  "name": "root_spot_grid",
  "instructions": [
    {
      "name": "initializeMarket",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "phoenixMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "protocolFeeRecipient",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "quoteTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "protocolFeePerFillBps",
          "type": "u16"
        },
        {
          "name": "minOrderSpacingInTicks",
          "type": "u64"
        },
        {
          "name": "minOrderSizeInBaseLots",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateMarket",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newProtocolFeePerFillBps",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "minOrderSpacingInTicks",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newMinOrderSizeInBaseLots",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "createPosition",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "phoenixMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "spotGridMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "positionKey",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tradeManager",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "logAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "seat",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "seatManager",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "seatDepositCollector",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "quoteTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenUserAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quoteTokenUserAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quoteTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "basePhoenixVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quotePhoenixVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "phoenixProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "phoenixSeatManagerProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "PositionArgs"
          }
        }
      ]
    },
    {
      "name": "cancelOrders",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "phoenixMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionKey",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tradeManager",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "logAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "quoteTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quoteTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "basePhoenixVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quotePhoenixVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "phoenixProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closePosition",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "phoenixMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionKey",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tradeManager",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "quoteTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenUserAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quoteTokenUserAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quoteTokenVaultAc",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "phoenixMarket",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "protocolFeeRecipient",
            "type": "publicKey"
          },
          {
            "name": "baseTokenMint",
            "type": "publicKey"
          },
          {
            "name": "quoteTokenMint",
            "type": "publicKey"
          },
          {
            "name": "protocolFeePerFillBps",
            "type": "u16"
          },
          {
            "name": "minOrderSpacingInTicks",
            "type": "u64"
          },
          {
            "name": "minOrderSizeInBaseLots",
            "type": "u64"
          },
          {
            "name": "claimedProtocolFeeInQuoteTokens",
            "type": "u64"
          },
          {
            "name": "unclaimedProtocolFeeInQuoteTokens",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "positionKey",
            "type": "publicKey"
          },
          {
            "name": "market",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "tradeManager",
            "type": "publicKey"
          },
          {
            "name": "positionArgs",
            "type": {
              "defined": "PositionArgs"
            }
          },
          {
            "name": "feeGrowthBase",
            "type": "u64"
          },
          {
            "name": "feeGrowthQuote",
            "type": "u64"
          },
          {
            "name": "activeOrders",
            "type": {
              "array": [
                {
                  "defined": "OrderParams"
                },
                15
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "OrderParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderSequenceNumber",
            "type": "u64"
          },
          {
            "name": "priceInTicks",
            "type": "u64"
          },
          {
            "name": "sizeInBaseLots",
            "type": "u64"
          },
          {
            "name": "isBid",
            "type": "bool"
          },
          {
            "name": "isNull",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "PositionArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mode",
            "type": {
              "defined": "Mode"
            }
          },
          {
            "name": "numGrids",
            "type": "u64"
          },
          {
            "name": "minPriceInTicks",
            "type": "u64"
          },
          {
            "name": "maxPriceInTicks",
            "type": "u64"
          },
          {
            "name": "orderSizeInBaseLots",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "DeserializedFIFOOrderId",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "priceInTicks",
            "type": "u64"
          },
          {
            "name": "orderSequenceNumber",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Mode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Arithmetic"
          },
          {
            "name": "Geometric"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPriceRange",
      "msg": "Invalid price range"
    },
    {
      "code": 6001,
      "name": "ExceededMaxNumGrids",
      "msg": "Exceeded number of grids limit"
    },
    {
      "code": 6002,
      "name": "InvalidOrderSize",
      "msg": "Order size less than minimum size required"
    },
    {
      "code": 6003,
      "name": "InvalidPhoenixProgram",
      "msg": "Phoenix program id invalid"
    },
    {
      "code": 6004,
      "name": "PhoenixMarketError",
      "msg": "Phoenix market deserialization error"
    },
    {
      "code": 6005,
      "name": "PhoenixVaultSeatRetired",
      "msg": "Phoenix vault seat Retired"
    },
    {
      "code": 6006,
      "name": "InvalidBaseLotSize",
      "msg": "Invalid base lot size"
    },
    {
      "code": 6007,
      "name": "PendingOpenOrders",
      "msg": "Pending open orders before closure"
    }
  ]
};
