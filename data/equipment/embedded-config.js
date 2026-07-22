"use strict";

(() => {
  const ns = window.PixelEquipment = window.PixelEquipment || {};
  ns.EMBEDDED_CONFIG = Object.freeze({
  "rig": {
    "schemaVersion": 1,
    "id": "starborn_player",
    "defaultAnimation": "idle",
    "renderSize": [
      82,
      102
    ],
    "shadow": {
      "width": 40,
      "height": 12,
      "y": 13,
      "alpha": 0.28
    },
    "layerOrder": {
      "shadow": -100,
      "body": 0,
      "hair": 10,
      "armor": 20,
      "shield": 25,
      "helmet": 30,
      "weapon": 40,
      "effect": 50
    },
    "spriteSheets": [
      {
        "id": "hero_directional",
        "src": "../../assets/sprites/hero-base-layered-atlas.png?v=2",
        "columns": 4,
        "rows": 5
      },
      {
        "id": "hero_walk",
        "src": "../../assets/sprites/hero-base-walk-atlas.png?v=2",
        "columns": 4,
        "rows": 2
      },
      {
        "id": "hero_run",
        "src": "../../assets/sprites/hero-base-run-atlas.png?v=2",
        "columns": 4,
        "rows": 4
      }
    ],
    "layers": [
      {
        "id": "body",
        "layer": "body",
        "animationSource": true
      },
      {
        "id": "hair",
        "layer": "hair",
        "visible": false
      }
    ],
    "animations": {
      "idle": {
        "fps": 2,
        "loop": true,
        "directions": {
          "right": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 0,
                "row": 0
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            }
          ],
          "down": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 1,
                "row": 0
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            }
          ],
          "left": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 2,
                "row": 0
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            }
          ],
          "up": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 3,
                "row": 0
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            }
          ]
        }
      },
      "walk": {
        "fps": 7,
        "loop": true,
        "directions": {
          "right": [
            {
              "sheet": "hero_walk",
              "source": {
                "col": 0,
                "row": 0
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            },
            {
              "sheet": "hero_walk",
              "source": {
                "col": 0,
                "row": 1
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            }
          ],
          "down": [
            {
              "sheet": "hero_walk",
              "source": {
                "col": 1,
                "row": 0
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            },
            {
              "sheet": "hero_walk",
              "source": {
                "col": 1,
                "row": 1
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            }
          ],
          "left": [
            {
              "sheet": "hero_walk",
              "source": {
                "col": 2,
                "row": 0
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            },
            {
              "sheet": "hero_walk",
              "source": {
                "col": 2,
                "row": 1
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            }
          ],
          "up": [
            {
              "sheet": "hero_walk",
              "source": {
                "col": 3,
                "row": 0
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            },
            {
              "sheet": "hero_walk",
              "source": {
                "col": 3,
                "row": 1
              },
              "anchor": "bodyAnchor",
              "size": [
                82,
                102
              ]
            }
          ]
        }
      },
      "run": {
        "fps": 12,
        "loop": true,
        "directions": {
          "right": [
            {
              "sheet": "hero_run",
              "source": {
                "col": 0,
                "row": 0
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 0,
                "row": 1
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 0,
                "row": 2
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 0,
                "row": 3
              }
            }
          ],
          "down": [
            {
              "sheet": "hero_run",
              "source": {
                "col": 1,
                "row": 0
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 1,
                "row": 1
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 1,
                "row": 2
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 1,
                "row": 3
              }
            }
          ],
          "left": [
            {
              "sheet": "hero_run",
              "source": {
                "col": 2,
                "row": 0
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 2,
                "row": 1
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 2,
                "row": 2
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 2,
                "row": 3
              }
            }
          ],
          "up": [
            {
              "sheet": "hero_run",
              "source": {
                "col": 3,
                "row": 0
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 3,
                "row": 1
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 3,
                "row": 2
              }
            },
            {
              "sheet": "hero_run",
              "source": {
                "col": 3,
                "row": 3
              }
            }
          ]
        }
      },
      "attack": {
        "fps": 12,
        "loop": false,
        "directions": {
          "right": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 0,
                "row": 2
              }
            },
            {
              "sheet": "hero_directional",
              "source": {
                "col": 0,
                "row": 3
              }
            },
            {
              "sheet": "hero_directional",
              "source": {
                "col": 0,
                "row": 4
              }
            }
          ],
          "down": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 1,
                "row": 2
              }
            },
            {
              "sheet": "hero_directional",
              "source": {
                "col": 1,
                "row": 3
              }
            },
            {
              "sheet": "hero_directional",
              "source": {
                "col": 1,
                "row": 4
              }
            }
          ],
          "left": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 2,
                "row": 2
              }
            },
            {
              "sheet": "hero_directional",
              "source": {
                "col": 2,
                "row": 3
              }
            },
            {
              "sheet": "hero_directional",
              "source": {
                "col": 2,
                "row": 4
              }
            }
          ],
          "up": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 3,
                "row": 2
              }
            },
            {
              "sheet": "hero_directional",
              "source": {
                "col": 3,
                "row": 3
              }
            },
            {
              "sheet": "hero_directional",
              "source": {
                "col": 3,
                "row": 4
              }
            }
          ]
        }
      },
      "hurt": {
        "fps": 8,
        "loop": false,
        "directions": {
          "right": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 0,
                "row": 4
              }
            }
          ],
          "down": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 1,
                "row": 4
              }
            }
          ],
          "left": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 2,
                "row": 4
              }
            }
          ],
          "up": [
            {
              "sheet": "hero_directional",
              "source": {
                "col": 3,
                "row": 4
              }
            }
          ]
        }
      }
    },
    "anchors": {
      "default": {
        "right": {
          "bodyAnchor": {
            "x": 0,
            "y": -22
          },
          "headAnchor": {
            "x": 12,
            "y": -38
          },
          "leftHandAnchor": {
            "x": -11,
            "y": -23
          },
          "rightHandAnchor": {
            "x": 15,
            "y": -23
          },
          "backAnchor": {
            "x": -10,
            "y": -29
          },
          "leftFootAnchor": {
            "x": -8,
            "y": 8
          },
          "rightFootAnchor": {
            "x": 8,
            "y": 8
          }
        },
        "down": {
          "bodyAnchor": {
            "x": 0,
            "y": -22
          },
          "headAnchor": {
            "x": 6,
            "y": -38
          },
          "leftHandAnchor": {
            "x": -9,
            "y": -19
          },
          "rightHandAnchor": {
            "x": 9,
            "y": -19
          },
          "backAnchor": {
            "x": 0,
            "y": -29
          },
          "leftFootAnchor": {
            "x": -8,
            "y": 8
          },
          "rightFootAnchor": {
            "x": 8,
            "y": 8
          }
        },
        "left": {
          "bodyAnchor": {
            "x": 0,
            "y": -22
          },
          "headAnchor": {
            "x": -6,
            "y": -38
          },
          "leftHandAnchor": {
            "x": 11,
            "y": -23
          },
          "rightHandAnchor": {
            "x": -15,
            "y": -23
          },
          "backAnchor": {
            "x": 10,
            "y": -29
          },
          "leftFootAnchor": {
            "x": -8,
            "y": 8
          },
          "rightFootAnchor": {
            "x": 8,
            "y": 8
          }
        },
        "up": {
          "bodyAnchor": {
            "x": 0,
            "y": -22
          },
          "headAnchor": {
            "x": -8,
            "y": -38
          },
          "leftHandAnchor": {
            "x": -7,
            "y": -27
          },
          "rightHandAnchor": {
            "x": 7,
            "y": -27
          },
          "backAnchor": {
            "x": 0,
            "y": -30
          },
          "leftFootAnchor": {
            "x": -7,
            "y": 8
          },
          "rightFootAnchor": {
            "x": 7,
            "y": 8
          }
        }
      },
      "animations": {
        "idle": {
          "frames": [
            {
              "right": {
                "rightHandAnchor": {
                  "x": 3,
                  "y": 7
                }
              },
              "down": {
                "rightHandAnchor": {
                  "x": 3,
                  "y": 6
                }
              },
              "left": {
                "rightHandAnchor": {
                  "x": -3,
                  "y": 7
                }
              },
              "up": {
                "rightHandAnchor": {
                  "x": 0,
                  "y": 8
                }
              }
            }
          ]
        },
        "walk": {
          "frames": [
            {
              "all": {
                "bodyAnchor": {
                  "y": 1
                },
                "backAnchor": {
                  "y": 1
                },
                "leftHandAnchor": {
                  "y": 1
                }
              },
              "right": {
                "headAnchor": {
                  "x": -5,
                  "y": -4
                },
                "rightHandAnchor": {
                  "x": -14,
                  "y": 17
                },
                "leftFootAnchor": {
                  "x": -2
                },
                "rightFootAnchor": {
                  "x": 2
                }
              },
              "down": {
                "headAnchor": {
                  "x": -6,
                  "y": -4
                },
                "rightHandAnchor": {
                  "x": -1,
                  "y": 18
                },
                "leftFootAnchor": {
                  "y": -2
                },
                "rightFootAnchor": {
                  "y": 2
                }
              },
              "left": {
                "headAnchor": {
                  "x": 0,
                  "y": -4
                },
                "rightHandAnchor": {
                  "x": 15,
                  "y": 16
                },
                "leftFootAnchor": {
                  "x": 2
                },
                "rightFootAnchor": {
                  "x": -2
                }
              },
              "up": {
                "headAnchor": {
                  "x": 10,
                  "y": -4
                },
                "rightHandAnchor": {
                  "x": 4,
                  "y": 26
                },
                "leftFootAnchor": {
                  "y": 2
                },
                "rightFootAnchor": {
                  "y": -2
                }
              }
            },
            {
              "all": {
                "bodyAnchor": {
                  "y": -1
                },
                "backAnchor": {
                  "y": -1
                },
                "leftHandAnchor": {
                  "y": -1
                }
              },
              "right": {
                "headAnchor": {
                  "x": -5,
                  "y": -16
                },
                "rightHandAnchor": {
                  "x": 5,
                  "y": 25
                },
                "leftFootAnchor": {
                  "x": 2
                },
                "rightFootAnchor": {
                  "x": -2
                }
              },
              "down": {
                "headAnchor": {
                  "x": -7,
                  "y": -16
                },
                "rightHandAnchor": {
                  "x": 0,
                  "y": 0
                },
                "leftFootAnchor": {
                  "y": 2
                },
                "rightFootAnchor": {
                  "y": -2
                }
              },
              "left": {
                "headAnchor": {
                  "x": 0,
                  "y": -16
                },
                "rightHandAnchor": {
                  "x": -1,
                  "y": 4
                },
                "leftFootAnchor": {
                  "x": -2
                },
                "rightFootAnchor": {
                  "x": 2
                }
              },
              "up": {
                "headAnchor": {
                  "x": 10,
                  "y": -16
                },
                "rightHandAnchor": {
                  "x": 5,
                  "y": 8
                },
                "leftFootAnchor": {
                  "y": -2
                },
                "rightFootAnchor": {
                  "y": 2
                }
              }
            }
          ]
        },
        "run": {
          "frames": [
            {
              "all": {
                "bodyAnchor": {
                  "y": 0
                },
                "leftHandAnchor": {
                  "x": -2
                }
              },
              "right": {
                "headAnchor": {
                  "x": -1,
                  "y": -4
                },
                "rightHandAnchor": {
                  "x": 6,
                  "y": 4
                }
              },
              "down": {
                "headAnchor": {
                  "x": -5,
                  "y": -4
                },
                "rightHandAnchor": {
                  "x": 1,
                  "y": 5
                }
              },
              "left": {
                "headAnchor": {
                  "x": -7,
                  "y": -4
                },
                "rightHandAnchor": {
                  "x": -6,
                  "y": 6
                }
              },
              "up": {
                "headAnchor": {
                  "x": 6,
                  "y": -4
                },
                "rightHandAnchor": {
                  "x": 1,
                  "y": 15
                }
              }
            },
            {
              "all": {
                "bodyAnchor": {
                  "y": -2
                },
                "leftHandAnchor": {
                  "y": 2
                },
                "leftFootAnchor": {
                  "y": -3
                },
                "rightFootAnchor": {
                  "y": 3
                }
              },
              "right": {
                "headAnchor": {
                  "x": -5,
                  "y": -9
                },
                "rightHandAnchor": {
                  "x": -1,
                  "y": -2
                }
              },
              "down": {
                "headAnchor": {
                  "x": -6,
                  "y": -9
                },
                "rightHandAnchor": {
                  "x": -2,
                  "y": -1
                }
              },
              "left": {
                "headAnchor": {
                  "x": -6,
                  "y": -9
                },
                "rightHandAnchor": {
                  "x": -3,
                  "y": -1
                }
              },
              "up": {
                "headAnchor": {
                  "x": 6,
                  "y": -9
                },
                "rightHandAnchor": {
                  "x": 0,
                  "y": 7
                }
              }
            },
            {
              "all": {
                "bodyAnchor": {
                  "y": 0
                },
                "leftHandAnchor": {
                  "x": 2
                }
              },
              "right": {
                "headAnchor": {
                  "x": -15,
                  "y": -7
                },
                "rightHandAnchor": {
                  "x": 1,
                  "y": 0
                }
              },
              "down": {
                "headAnchor": {
                  "x": -6,
                  "y": -7
                },
                "rightHandAnchor": {
                  "x": 1,
                  "y": 3
                }
              },
              "left": {
                "headAnchor": {
                  "x": 7,
                  "y": -7
                },
                "rightHandAnchor": {
                  "x": 0,
                  "y": 4
                }
              },
              "up": {
                "headAnchor": {
                  "x": 6,
                  "y": -7
                },
                "rightHandAnchor": {
                  "x": 4,
                  "y": 11
                }
              }
            },
            {
              "all": {
                "bodyAnchor": {
                  "y": 2
                },
                "leftHandAnchor": {
                  "y": -2
                },
                "leftFootAnchor": {
                  "y": 3
                },
                "rightFootAnchor": {
                  "y": -3
                }
              },
              "right": {
                "headAnchor": {
                  "x": -12,
                  "y": -13
                },
                "rightHandAnchor": {
                  "x": 8,
                  "y": -8
                }
              },
              "down": {
                "headAnchor": {
                  "x": -6,
                  "y": -13
                },
                "rightHandAnchor": {
                  "x": 1,
                  "y": -3
                }
              },
              "left": {
                "headAnchor": {
                  "x": 1,
                  "y": -13
                },
                "rightHandAnchor": {
                  "x": -8,
                  "y": 18
                }
              },
              "up": {
                "headAnchor": {
                  "x": 6,
                  "y": -13
                },
                "rightHandAnchor": {
                  "x": 1,
                  "y": 6
                }
              }
            }
          ]
        },
        "attack": {
          "frames": [
            {
              "right": {
                "headAnchor": {
                  "x": 2,
                  "y": -5
                },
                "rightHandAnchor": {
                  "x": 15,
                  "y": 5
                }
              },
              "left": {
                "headAnchor": {
                  "x": -8,
                  "y": -5
                },
                "rightHandAnchor": {
                  "x": -11,
                  "y": 5
                }
              },
              "down": {
                "headAnchor": {
                  "x": -1,
                  "y": -5
                },
                "rightHandAnchor": {
                  "x": 8,
                  "y": 5
                }
              },
              "up": {
                "headAnchor": {
                  "x": 1,
                  "y": -5
                },
                "rightHandAnchor": {
                  "x": 11,
                  "y": 17
                }
              }
            },
            {
              "right": {
                "headAnchor": {
                  "x": -8,
                  "y": -11
                },
                "rightHandAnchor": {
                  "x": 17,
                  "y": 2
                }
              },
              "left": {
                "headAnchor": {
                  "x": 3,
                  "y": -11
                },
                "rightHandAnchor": {
                  "x": -17,
                  "y": -3
                }
              },
              "down": {
                "headAnchor": {
                  "x": 0,
                  "y": -11
                },
                "rightHandAnchor": {
                  "x": 0,
                  "y": 7
                }
              },
              "up": {
                "headAnchor": {
                  "x": 2,
                  "y": -11
                },
                "rightHandAnchor": {
                  "x": 5,
                  "y": -21
                }
              }
            },
            {
              "all": {
                "bodyAnchor": {
                  "y": 1
                }
              },
              "right": {
                "headAnchor": {
                  "x": 0,
                  "y": -14
                },
                "rightHandAnchor": {
                  "x": -5,
                  "y": 14
                }
              },
              "down": {
                "headAnchor": {
                  "x": 1,
                  "y": -14
                },
                "rightHandAnchor": {
                  "x": 9,
                  "y": 13
                }
              },
              "left": {
                "headAnchor": {
                  "x": 5,
                  "y": -14
                },
                "rightHandAnchor": {
                  "x": 4,
                  "y": 15
                }
              },
              "up": {
                "headAnchor": {
                  "x": 1,
                  "y": -14
                },
                "rightHandAnchor": {
                  "x": 6,
                  "y": 20
                }
              }
            }
          ]
        },
        "hurt": {
          "frames": [
            {
              "all": {
                "bodyAnchor": {
                  "y": 3
                },
                "leftHandAnchor": {
                  "y": 3
                }
              },
              "right": {
                "headAnchor": {
                  "x": 0,
                  "y": -14
                },
                "rightHandAnchor": {
                  "x": -5,
                  "y": 16
                }
              },
              "down": {
                "headAnchor": {
                  "x": 1,
                  "y": -14
                },
                "rightHandAnchor": {
                  "x": 9,
                  "y": 15
                }
              },
              "left": {
                "headAnchor": {
                  "x": 5,
                  "y": -14
                },
                "rightHandAnchor": {
                  "x": 4,
                  "y": 17
                }
              },
              "up": {
                "headAnchor": {
                  "x": 1,
                  "y": -14
                },
                "rightHandAnchor": {
                  "x": 6,
                  "y": 22
                }
              }
            }
          ]
        }
      }
    }
  },
  "catalog": {
    "schemaVersion": 2,
    "version": 2,
    "spriteSheets": [
      {
        "id": "armor_forest_directional",
        "src": "../../assets/sprites/armor-forest-overlay-directional-v1.png?v=2",
        "columns": 4,
        "rows": 5
      },
      {
        "id": "armor_forest_walk",
        "src": "../../assets/sprites/armor-forest-overlay-walk-v1.png?v=2",
        "columns": 4,
        "rows": 2
      },
      {
        "id": "armor_forest_run",
        "src": "../../assets/sprites/armor-forest-overlay-run-v1.png?v=2",
        "columns": 4,
        "rows": 4
      },
      {
        "id": "wearable_equipment",
        "src": "../../assets/sprites/wearable-equipment-atlas-v1.png?v=2",
        "columns": 5,
        "rows": 3
      },
      {
        "id": "helmet_directional",
        "src": "../../assets/sprites/helmet-directional-atlas-v3.png?v=1",
        "columns": 5,
        "rows": 4
      }
    ],
    "animationSets": {
      "forest_vanguard": {
        "idle": {
          "right": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 0,
                "row": 0
              }
            }
          ],
          "down": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 1,
                "row": 0
              }
            }
          ],
          "left": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 2,
                "row": 0
              }
            }
          ],
          "up": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 3,
                "row": 0
              }
            }
          ]
        },
        "walk": {
          "right": [
            {
              "sheet": "armor_forest_walk",
              "source": {
                "col": 0,
                "row": 0
              }
            },
            {
              "sheet": "armor_forest_walk",
              "source": {
                "col": 0,
                "row": 1
              }
            }
          ],
          "down": [
            {
              "sheet": "armor_forest_walk",
              "source": {
                "col": 1,
                "row": 0
              }
            },
            {
              "sheet": "armor_forest_walk",
              "source": {
                "col": 1,
                "row": 1
              }
            }
          ],
          "left": [
            {
              "sheet": "armor_forest_walk",
              "source": {
                "col": 2,
                "row": 0
              }
            },
            {
              "sheet": "armor_forest_walk",
              "source": {
                "col": 2,
                "row": 1
              }
            }
          ],
          "up": [
            {
              "sheet": "armor_forest_walk",
              "source": {
                "col": 3,
                "row": 0
              }
            },
            {
              "sheet": "armor_forest_walk",
              "source": {
                "col": 3,
                "row": 1
              }
            }
          ]
        },
        "run": {
          "right": [
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 0,
                "row": 0
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 0,
                "row": 1
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 0,
                "row": 2
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 0,
                "row": 3
              }
            }
          ],
          "down": [
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 1,
                "row": 0
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 1,
                "row": 1
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 1,
                "row": 2
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 1,
                "row": 3
              }
            }
          ],
          "left": [
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 2,
                "row": 0
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 2,
                "row": 1
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 2,
                "row": 2
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 2,
                "row": 3
              }
            }
          ],
          "up": [
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 3,
                "row": 0
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 3,
                "row": 1
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 3,
                "row": 2
              }
            },
            {
              "sheet": "armor_forest_run",
              "source": {
                "col": 3,
                "row": 3
              }
            }
          ]
        },
        "attack": {
          "right": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 0,
                "row": 2
              }
            },
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 0,
                "row": 3
              }
            },
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 0,
                "row": 4
              }
            }
          ],
          "down": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 1,
                "row": 2
              }
            },
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 1,
                "row": 3
              }
            },
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 1,
                "row": 4
              }
            }
          ],
          "left": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 2,
                "row": 2
              }
            },
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 2,
                "row": 3
              }
            },
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 2,
                "row": 4
              }
            }
          ],
          "up": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 3,
                "row": 2
              }
            },
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 3,
                "row": 3
              }
            },
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 3,
                "row": 4
              }
            }
          ]
        },
        "hurt": {
          "right": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 0,
                "row": 4
              }
            }
          ],
          "down": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 1,
                "row": 4
              }
            }
          ],
          "left": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 2,
                "row": 4
              }
            }
          ],
          "up": [
            {
              "sheet": "armor_forest_directional",
              "source": {
                "col": 3,
                "row": 4
              }
            }
          ]
        }
      }
    },
    "items": [
      {
        "id": "weapon_sword",
        "type": "weapon",
        "slot": "rightHand",
        "layer": "weapon",
        "anchor": "rightHandAnchor",
        "rotationMode": "weapon",
        "rotation": 45,
        "carryOnBack": true,
        "backPose": {
          "anchor": "backAnchor",
          "layer": "body",
          "zOffset": -5,
          "rotationMode": "anchor",
          "rotation": 0,
          "offset": {
            "x": -2,
            "y": 10
          }
        },
        "zByDirection": {
          "up": -50
        },
        "tags": [
          "melee",
          "sword"
        ],
        "parts": [
          {
            "sheet": "wearable_equipment",
            "source": {
              "col": 0,
              "row": 2
            },
            "size": [
              54,
              54
            ],
            "origin": {
              "x": 0.33,
              "y": 0.58
            }
          }
        ]
      },
      {
        "id": "weapon_spear",
        "type": "weapon",
        "slot": "rightHand",
        "layer": "weapon",
        "anchor": "rightHandAnchor",
        "rotationMode": "weapon",
        "rotation": 45,
        "carryOnBack": true,
        "backPose": {
          "anchor": "backAnchor",
          "layer": "body",
          "zOffset": -5,
          "rotationMode": "anchor",
          "rotation": 0,
          "offset": {
            "x": -4,
            "y": 12
          }
        },
        "zByDirection": {
          "up": -50
        },
        "tags": [
          "melee",
          "spear"
        ],
        "parts": [
          {
            "sheet": "wearable_equipment",
            "source": {
              "col": 1,
              "row": 2
            },
            "size": [
              60,
              60
            ],
            "origin": {
              "x": 0.31,
              "y": 0.63
            }
          }
        ]
      },
      {
        "id": "weapon_axe",
        "type": "weapon",
        "slot": "rightHand",
        "layer": "weapon",
        "anchor": "rightHandAnchor",
        "rotationMode": "weapon",
        "rotation": 45,
        "carryOnBack": true,
        "backPose": {
          "anchor": "backAnchor",
          "layer": "body",
          "zOffset": -5,
          "rotationMode": "anchor",
          "rotation": 0,
          "offset": {
            "x": -3,
            "y": 11
          }
        },
        "zByDirection": {
          "up": -50
        },
        "tags": [
          "melee",
          "axe"
        ],
        "parts": [
          {
            "sheet": "wearable_equipment",
            "source": {
              "col": 2,
              "row": 2
            },
            "size": [
              56,
              56
            ],
            "origin": {
              "x": 0.27,
              "y": 0.59
            }
          }
        ]
      },
      {
        "id": "weapon_staff",
        "type": "weapon",
        "slot": "rightHand",
        "layer": "weapon",
        "anchor": "rightHandAnchor",
        "rotationMode": "weapon",
        "rotation": 45,
        "carryOnBack": true,
        "backPose": {
          "anchor": "backAnchor",
          "layer": "body",
          "zOffset": -5,
          "rotationMode": "anchor",
          "rotation": 0,
          "offset": {
            "x": -5,
            "y": 12
          }
        },
        "zByDirection": {
          "up": -50
        },
        "tags": [
          "ranged",
          "staff"
        ],
        "parts": [
          {
            "sheet": "wearable_equipment",
            "source": {
              "col": 3,
              "row": 2
            },
            "size": [
              58,
              58
            ],
            "origin": {
              "x": 0.16,
              "y": 0.6
            }
          }
        ]
      },
      {
        "id": "weapon_daggers",
        "type": "weapon",
        "slot": "rightHand",
        "layer": "weapon",
        "anchor": "rightHandAnchor",
        "rotationMode": "weapon",
        "rotation": 45,
        "carryOnBack": true,
        "backPose": {
          "anchor": "backAnchor",
          "layer": "body",
          "zOffset": -5,
          "rotationMode": "anchor",
          "rotation": 0,
          "offset": {
            "x": -1,
            "y": 9
          }
        },
        "zByDirection": {
          "up": -50
        },
        "tags": [
          "melee",
          "daggers"
        ],
        "parts": [
          {
            "sheet": "wearable_equipment",
            "source": {
              "col": 4,
              "row": 2
            },
            "size": [
              48,
              48
            ],
            "origin": {
              "x": 0.34,
              "y": 0.54
            }
          }
        ]
      },
      {
        "id": "helmet_0",
        "type": "helmet",
        "slot": "head",
        "layer": "helmet",
        "anchor": "headAnchor",
        "parts": [
          {
            "sheet": "helmet_directional",
            "source": {
              "col": 0,
              "row": 1
            },
            "size": [
              48,
              48
            ],
            "directions": {
              "right": {
                "source": {
                  "row": 0
                }
              },
              "down": {
                "source": {
                  "row": 1
                }
              },
              "left": {
                "source": {
                  "row": 2
                }
              },
              "up": {
                "source": {
                  "row": 3
                }
              }
            }
          }
        ]
      },
      {
        "id": "helmet_1",
        "type": "helmet",
        "slot": "head",
        "layer": "helmet",
        "anchor": "headAnchor",
        "parts": [
          {
            "sheet": "helmet_directional",
            "source": {
              "col": 1,
              "row": 1
            },
            "size": [
              48,
              48
            ],
            "directions": {
              "right": {
                "source": {
                  "row": 0
                }
              },
              "down": {
                "source": {
                  "row": 1
                }
              },
              "left": {
                "source": {
                  "row": 2
                }
              },
              "up": {
                "source": {
                  "row": 3
                }
              }
            }
          }
        ]
      },
      {
        "id": "helmet_2",
        "type": "helmet",
        "slot": "head",
        "layer": "helmet",
        "anchor": "headAnchor",
        "parts": [
          {
            "sheet": "helmet_directional",
            "source": {
              "col": 2,
              "row": 1
            },
            "size": [
              48,
              48
            ],
            "directions": {
              "right": {
                "source": {
                  "row": 0
                }
              },
              "down": {
                "source": {
                  "row": 1
                }
              },
              "left": {
                "source": {
                  "row": 2
                }
              },
              "up": {
                "source": {
                  "row": 3
                }
              }
            }
          }
        ]
      },
      {
        "id": "helmet_3",
        "type": "helmet",
        "slot": "head",
        "layer": "helmet",
        "anchor": "headAnchor",
        "parts": [
          {
            "sheet": "helmet_directional",
            "source": {
              "col": 3,
              "row": 1
            },
            "size": [
              48,
              48
            ],
            "directions": {
              "right": {
                "source": {
                  "row": 0
                }
              },
              "down": {
                "source": {
                  "row": 1
                }
              },
              "left": {
                "source": {
                  "row": 2
                }
              },
              "up": {
                "source": {
                  "row": 3
                }
              }
            }
          }
        ]
      },
      {
        "id": "helmet_4",
        "type": "helmet",
        "slot": "head",
        "layer": "helmet",
        "anchor": "headAnchor",
        "parts": [
          {
            "sheet": "helmet_directional",
            "source": {
              "col": 4,
              "row": 1
            },
            "size": [
              48,
              48
            ],
            "directions": {
              "right": {
                "source": {
                  "row": 0
                }
              },
              "down": {
                "source": {
                  "row": 1
                }
              },
              "left": {
                "source": {
                  "row": 2
                }
              },
              "up": {
                "source": {
                  "row": 3
                }
              }
            }
          }
        ]
      },
      {
        "id": "armor_0",
        "type": "armor",
        "slot": "body",
        "layer": "armor",
        "anchor": "bodyAnchor",
        "animationSet": "forest_vanguard",
        "parts": [
          {
            "sheet": "armor_forest_directional",
            "source": {
              "col": 0,
              "row": 0,
              "subRect": [
                0,
                0,
                1,
                0.72
              ]
            },
            "animationSet": "forest_vanguard",
            "size": [
              82,
              73
            ],
            "origin": {
              "x": 0.5,
              "y": 0.7
            }
          }
        ]
      },
      {
        "id": "armor_1",
        "type": "armor",
        "slot": "body",
        "layer": "armor",
        "anchor": "bodyAnchor",
        "animationSet": "forest_vanguard",
        "filter": "hue-rotate(235deg) saturate(1.45) brightness(1.05)",
        "parts": [
          {
            "sheet": "armor_forest_directional",
            "source": {
              "col": 0,
              "row": 0,
              "subRect": [
                0,
                0,
                1,
                0.72
              ]
            },
            "animationSet": "forest_vanguard",
            "size": [
              82,
              73
            ],
            "origin": {
              "x": 0.5,
              "y": 0.7
            }
          }
        ]
      },
      {
        "id": "armor_2",
        "type": "armor",
        "slot": "body",
        "layer": "armor",
        "anchor": "bodyAnchor",
        "animationSet": "forest_vanguard",
        "filter": "hue-rotate(75deg) saturate(0.75) brightness(1.35)",
        "parts": [
          {
            "sheet": "armor_forest_directional",
            "source": {
              "col": 0,
              "row": 0,
              "subRect": [
                0,
                0,
                1,
                0.72
              ]
            },
            "animationSet": "forest_vanguard",
            "size": [
              82,
              73
            ],
            "origin": {
              "x": 0.5,
              "y": 0.7
            }
          }
        ]
      },
      {
        "id": "armor_3",
        "type": "armor",
        "slot": "body",
        "layer": "armor",
        "anchor": "bodyAnchor",
        "animationSet": "forest_vanguard",
        "filter": "hue-rotate(120deg) saturate(1.1) brightness(1.15)",
        "parts": [
          {
            "sheet": "armor_forest_directional",
            "source": {
              "col": 0,
              "row": 0,
              "subRect": [
                0,
                0,
                1,
                0.72
              ]
            },
            "animationSet": "forest_vanguard",
            "size": [
              82,
              73
            ],
            "origin": {
              "x": 0.5,
              "y": 0.7
            }
          }
        ]
      },
      {
        "id": "armor_4",
        "type": "armor",
        "slot": "body",
        "layer": "armor",
        "anchor": "bodyAnchor",
        "animationSet": "forest_vanguard",
        "filter": "hue-rotate(170deg) saturate(0.9) brightness(0.72) contrast(1.15)",
        "parts": [
          {
            "sheet": "armor_forest_directional",
            "source": {
              "col": 0,
              "row": 0,
              "subRect": [
                0,
                0,
                1,
                0.72
              ]
            },
            "animationSet": "forest_vanguard",
            "size": [
              82,
              73
            ],
            "origin": {
              "x": 0.5,
              "y": 0.7
            }
          }
        ]
      },
      {
        "id": "boots_0",
        "type": "boots",
        "slot": "feet",
        "layer": "armor",
        "anchor": "bodyAnchor",
        "animationSet": "forest_vanguard",
        "parts": [
          {
            "sheet": "armor_forest_directional",
            "source": {
              "col": 0,
              "row": 0,
              "subRect": [
                0,
                0.72,
                1,
                0.28
              ]
            },
            "animationSet": "forest_vanguard",
            "offset": {
              "x": 0,
              "y": 36
            },
            "size": [
              82,
              29
            ]
          }
        ]
      },
      {
        "id": "boots_1",
        "type": "boots",
        "slot": "feet",
        "layer": "armor",
        "anchor": "bodyAnchor",
        "animationSet": "forest_vanguard",
        "filter": "hue-rotate(235deg) saturate(1.45) brightness(1.05)",
        "parts": [
          {
            "sheet": "armor_forest_directional",
            "source": {
              "col": 0,
              "row": 0,
              "subRect": [
                0,
                0.72,
                1,
                0.28
              ]
            },
            "animationSet": "forest_vanguard",
            "offset": {
              "x": 0,
              "y": 36
            },
            "size": [
              82,
              29
            ]
          }
        ]
      },
      {
        "id": "boots_2",
        "type": "boots",
        "slot": "feet",
        "layer": "armor",
        "anchor": "bodyAnchor",
        "animationSet": "forest_vanguard",
        "filter": "hue-rotate(75deg) saturate(0.75) brightness(1.35)",
        "parts": [
          {
            "sheet": "armor_forest_directional",
            "source": {
              "col": 0,
              "row": 0,
              "subRect": [
                0,
                0.72,
                1,
                0.28
              ]
            },
            "animationSet": "forest_vanguard",
            "offset": {
              "x": 0,
              "y": 36
            },
            "size": [
              82,
              29
            ]
          }
        ]
      },
      {
        "id": "boots_3",
        "type": "boots",
        "slot": "feet",
        "layer": "armor",
        "anchor": "bodyAnchor",
        "animationSet": "forest_vanguard",
        "filter": "hue-rotate(120deg) saturate(1.1) brightness(1.15)",
        "parts": [
          {
            "sheet": "armor_forest_directional",
            "source": {
              "col": 0,
              "row": 0,
              "subRect": [
                0,
                0.72,
                1,
                0.28
              ]
            },
            "animationSet": "forest_vanguard",
            "offset": {
              "x": 0,
              "y": 36
            },
            "size": [
              82,
              29
            ]
          }
        ]
      },
      {
        "id": "boots_4",
        "type": "boots",
        "slot": "feet",
        "layer": "armor",
        "anchor": "bodyAnchor",
        "animationSet": "forest_vanguard",
        "filter": "hue-rotate(170deg) saturate(0.9) brightness(0.72) contrast(1.15)",
        "parts": [
          {
            "sheet": "armor_forest_directional",
            "source": {
              "col": 0,
              "row": 0,
              "subRect": [
                0,
                0.72,
                1,
                0.28
              ]
            },
            "animationSet": "forest_vanguard",
            "offset": {
              "x": 0,
              "y": 36
            },
            "size": [
              82,
              29
            ]
          }
        ]
      },
      {
        "id": "amulet_0",
        "type": "effect",
        "slot": "neck",
        "layer": "effect",
        "parts": [
          {
            "kind": "aura",
            "anchor": "bodyAnchor",
            "size": [
              58,
              58
            ],
            "alpha": 0.28,
            "effect": {
              "color": "#9ee889",
              "radius": 29,
              "lineWidth": 2
            }
          }
        ]
      },
      {
        "id": "amulet_1",
        "type": "effect",
        "slot": "neck",
        "layer": "effect",
        "parts": [
          {
            "kind": "aura",
            "anchor": "bodyAnchor",
            "size": [
              58,
              58
            ],
            "alpha": 0.28,
            "effect": {
              "color": "#ffb55f",
              "radius": 29,
              "lineWidth": 2
            }
          }
        ]
      },
      {
        "id": "amulet_2",
        "type": "effect",
        "slot": "neck",
        "layer": "effect",
        "parts": [
          {
            "kind": "aura",
            "anchor": "bodyAnchor",
            "size": [
              58,
              58
            ],
            "alpha": 0.28,
            "effect": {
              "color": "#c1f3ff",
              "radius": 29,
              "lineWidth": 2
            }
          }
        ]
      },
      {
        "id": "amulet_3",
        "type": "effect",
        "slot": "neck",
        "layer": "effect",
        "parts": [
          {
            "kind": "aura",
            "anchor": "bodyAnchor",
            "size": [
              58,
              58
            ],
            "alpha": 0.28,
            "effect": {
              "color": "#d4b4ff",
              "radius": 29,
              "lineWidth": 2
            }
          }
        ]
      },
      {
        "id": "amulet_4",
        "type": "effect",
        "slot": "neck",
        "layer": "effect",
        "parts": [
          {
            "kind": "aura",
            "anchor": "bodyAnchor",
            "size": [
              58,
              58
            ],
            "alpha": 0.28,
            "effect": {
              "color": "#ff82dc",
              "radius": 29,
              "lineWidth": 2
            }
          }
        ]
      }
    ]
  }
});
})();
