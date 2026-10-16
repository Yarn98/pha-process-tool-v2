/* Blender equipment control metadata. */
window.PHAEquipmentModels = {
  "extrusion": {
    "id": "extrusion",
    "duration": 12,
    "poster": "assets/equipment/extrusion-motion-poster.png",
    "model": "assets/equipment/extrusion-motion.glb",
    "center": [
      -0.5,
      1.6,
      0
    ],
    "span": [
      11.6,
      4.2
    ],
    "controls": [
      {
        "key": "screw",
        "label": [
          "스크류 회전각",
          "Screw rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "flow",
        "label": [
          "수지 표시 위치",
          "Resin marker position"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "haul",
        "label": [
          "인취 롤 회전각",
          "Haul-off roll rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "cutter",
        "label": [
          "절단날 회전각",
          "Cutter rotation angle"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      }
    ],
    "views": [
      {
        "key": "all",
        "label": [
          "전체 라인",
          "Whole line"
        ],
        "center": [
          -0.5,
          1.6,
          0
        ],
        "zoom": 1
      },
      {
        "key": "screw",
        "label": [
          "스크류·공급",
          "Screw & feed"
        ],
        "center": [
          -3.1,
          1.65,
          0
        ],
        "zoom": 2.1
      },
      {
        "key": "finish",
        "label": [
          "성형·후단",
          "Forming & downstream"
        ],
        "center": [
          2.4,
          1.6,
          0
        ],
        "zoom": 2.0
      }
    ],
    "stages": [
      [
        "공급·용융",
        "Feed & melt"
      ],
      [
        "다이·성형",
        "Die & forming"
      ],
      [
        "냉각·인취",
        "Cool & haul off"
      ],
      [
        "제품·배출",
        "Product & discharge"
      ]
    ],
    "blender": "5.2.1 LTS",
    "groups": [
      "cutter",
      "flow",
      "haul",
      "screw"
    ]
  },
  "compounding": {
    "id": "compounding",
    "duration": 25.125,
    "frames": [
      0,
      603
    ],
    "poster": "assets/equipment/compounding-motion-poster.png",
    "model": "assets/equipment/compounding-motion.glb",
    "center": [
      2.45,
      0.95,
      0
    ],
    "span": [
      8.6,
      2.5
    ],
    "zoom": [
      0.7,
      14
    ],
    "controls": [
      {
        "key": "screw",
        "label": [
          "스크류 회전각",
          "Screw rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          25.125
        ]
      },
      {
        "key": "side",
        "label": [
          "사이드 피더 회전각",
          "Side feeder rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          25.125
        ]
      },
      {
        "key": "flow",
        "label": [
          "수지 표시 위치",
          "Resin marker position"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          25.125
        ]
      },
      {
        "key": "haul",
        "label": [
          "피드 롤 회전각",
          "Feed roll rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          25.125
        ]
      },
      {
        "key": "cutter",
        "label": [
          "커터 로터 회전각",
          "Cutter rotor rotation angle"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          25.125
        ]
      }
    ],
    "views": [
      {
        "key": "all",
        "label": [
          "전체 라인",
          "Whole line"
        ],
        "center": [
          2.45,
          0.95,
          0
        ],
        "zoom": 1
      },
      {
        "key": "screw",
        "label": [
          "스크류·배럴",
          "Screws & barrel"
        ],
        "center": [
          0.64,
          1.0,
          0
        ],
        "zoom": 5.5
      },
      {
        "key": "finish",
        "label": [
          "수조·펠릿타이저",
          "Bath & pelletiser"
        ],
        "center": [
          3.9,
          0.95,
          0
        ],
        "zoom": 2.2
      },
      {
        "key": "cutter",
        "label": [
          "피드 롤·커터",
          "Feed rolls & cutter"
        ],
        "center": [
          4.41,
          1.0,
          0
        ],
        "zoom": 9
      }
    ],
    "stages": [
      [
        "공급·이송",
        "Feed & convey"
      ],
      [
        "용융·혼합",
        "Melt & mix"
      ],
      [
        "탈가스",
        "Devolatilization"
      ],
      [
        "다이·펠릿 절단",
        "Die & pelletize"
      ]
    ],
    "turns": {
      "screw": 5,
      "side": 2.5,
      "haul": 1,
      "cutter": 10.5
    },
    "cut_edges": 8,
    "study": {
      "rpm": 120.0,
      "speed": 6.0,
      "diameter": 80.0,
      "pitch": 3.0
    },
    "teaching": {
      "time_scale": 0.1,
      "rpm": {
        "screw": 120.0,
        "side": 60.0,
        "haul": 23.87,
        "cutter": 250.0
      },
      "line_speed_m_min": 6.0,
      "pellet_mm": 3.0,
      "feed_roll_mm": 80.0,
      "loop_note": "Each drive turns a whole number of symmetric steps per loop (within 0.6 % of the scaled speed)."
    },
    "spec": {
      "basis": "Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA setting",
      "screw_d_mm": 32,
      "l_d": 40,
      "barrel_blocks": 10,
      "centre_distance_mm": 26.32,
      "do_di": 1.55,
      "shaft_height_mm": 1000,
      "elements": [
        [
          "C",
          128,
          48
        ],
        [
          "C",
          128,
          32
        ],
        [
          "C",
          64,
          32
        ],
        [
          "KB",
          32,
          45
        ],
        [
          "KB",
          32,
          45
        ],
        [
          "C",
          128,
          48
        ],
        [
          "C",
          128,
          48
        ],
        [
          "C",
          96,
          32
        ],
        [
          "KB",
          32,
          45
        ],
        [
          "KB",
          32,
          45
        ],
        [
          "KB",
          32,
          90
        ],
        [
          "C",
          64,
          32
        ],
        [
          "KB",
          32,
          90
        ],
        [
          "L",
          32,
          16
        ],
        [
          "C",
          64,
          32
        ],
        [
          "C",
          128,
          48
        ],
        [
          "C",
          64,
          32
        ],
        [
          "C",
          64,
          16
        ]
      ],
      "feed": "loss-in-weight, B1",
      "atmospheric_vent": "B4",
      "side_feeder": "B5",
      "vacuum_vent": "B9",
      "strand_holes": "6 x 3 mm, 12 mm pitch",
      "bath_m": 2.0,
      "feed_roll_mm": 80.0,
      "rotor_mm": 100,
      "rotor_blades": 8,
      "classifier_mm": "700 x 400",
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
    "blender": "5.2.1 LTS",
    "groups": [
      "cutter",
      "flow",
      "haul",
      "screw",
      "side"
    ]
  },
  "sheet": {
    "id": "sheet",
    "duration": 12,
    "poster": "assets/equipment/sheet-motion-poster.png",
    "model": "assets/equipment/sheet-motion.glb",
    "center": [
      -0.5,
      1.6,
      0
    ],
    "span": [
      11.6,
      4.2
    ],
    "controls": [
      {
        "key": "screw",
        "label": [
          "스크류 회전각",
          "Screw rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "flow",
        "label": [
          "수지 표시 위치",
          "Resin marker position"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "roll",
        "label": [
          "냉각 롤 회전각",
          "Cooling roll rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "winder",
        "label": [
          "권취축 회전각",
          "Winder rotation angle"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      }
    ],
    "views": [
      {
        "key": "all",
        "label": [
          "전체 라인",
          "Whole line"
        ],
        "center": [
          -0.5,
          1.6,
          0
        ],
        "zoom": 1
      },
      {
        "key": "screw",
        "label": [
          "스크류·공급",
          "Screw & feed"
        ],
        "center": [
          -3.1,
          1.65,
          0
        ],
        "zoom": 2.1
      },
      {
        "key": "finish",
        "label": [
          "성형·후단",
          "Forming & downstream"
        ],
        "center": [
          1.4,
          2.1,
          0
        ],
        "zoom": 2.0
      }
    ],
    "stages": [
      [
        "공급·용융",
        "Feed & melt"
      ],
      [
        "다이·성형",
        "Die & forming"
      ],
      [
        "냉각·인취",
        "Cool & haul off"
      ],
      [
        "제품·배출",
        "Product & discharge"
      ]
    ],
    "blender": "5.2.1 LTS",
    "groups": [
      "flow",
      "roll",
      "screw",
      "winder"
    ]
  },
  "castfilm": {
    "id": "castfilm",
    "duration": 12,
    "poster": "assets/equipment/castfilm-motion-poster.png",
    "model": "assets/equipment/castfilm-motion.glb",
    "center": [
      -0.5,
      1.6,
      0
    ],
    "span": [
      11.6,
      4.2
    ],
    "controls": [
      {
        "key": "screw",
        "label": [
          "스크류 회전각",
          "Screw rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "flow",
        "label": [
          "수지 표시 위치",
          "Resin marker position"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "roll",
        "label": [
          "냉각 롤 회전각",
          "Chill roll rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "winder",
        "label": [
          "권취축 회전각",
          "Winder rotation angle"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      }
    ],
    "views": [
      {
        "key": "all",
        "label": [
          "전체 라인",
          "Whole line"
        ],
        "center": [
          -0.5,
          1.6,
          0
        ],
        "zoom": 1
      },
      {
        "key": "screw",
        "label": [
          "스크류·공급",
          "Screw & feed"
        ],
        "center": [
          -3.1,
          1.65,
          0
        ],
        "zoom": 2.1
      },
      {
        "key": "finish",
        "label": [
          "성형·후단",
          "Forming & downstream"
        ],
        "center": [
          1.4,
          2.1,
          0
        ],
        "zoom": 2.0
      }
    ],
    "stages": [
      [
        "공급·용융",
        "Feed & melt"
      ],
      [
        "다이·성형",
        "Die & forming"
      ],
      [
        "냉각·인취",
        "Cool & haul off"
      ],
      [
        "제품·배출",
        "Product & discharge"
      ]
    ],
    "blender": "5.2.1 LTS",
    "groups": [
      "flow",
      "roll",
      "screw",
      "winder"
    ]
  },
  "blownfilm": {
    "id": "blownfilm",
    "duration": 12,
    "poster": "assets/equipment/blownfilm-motion-poster.png",
    "model": "assets/equipment/blownfilm-motion.glb",
    "center": [
      -0.5,
      2.8,
      0
    ],
    "span": [
      11.6,
      6.7
    ],
    "controls": [
      {
        "key": "screw",
        "label": [
          "스크류 회전각",
          "Screw rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "flow",
        "label": [
          "수지 표시 위치",
          "Resin marker position"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "bubble",
        "label": [
          "버블 형상 조절",
          "Bubble shape adjustment"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "haul",
        "label": [
          "닙롤 회전각",
          "Nip roll rotation angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      },
      {
        "key": "winder",
        "label": [
          "권취축 회전각",
          "Winder rotation angle"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          12
        ]
      }
    ],
    "views": [
      {
        "key": "all",
        "label": [
          "전체 라인",
          "Whole line"
        ],
        "center": [
          -0.5,
          2.8,
          0
        ],
        "zoom": 1
      },
      {
        "key": "screw",
        "label": [
          "스크류·공급",
          "Screw & feed"
        ],
        "center": [
          -3.1,
          1.65,
          0
        ],
        "zoom": 2.1
      },
      {
        "key": "finish",
        "label": [
          "버블·닙롤",
          "Bubble & nip"
        ],
        "center": [
          0.25,
          3.1,
          0
        ],
        "zoom": 1.7
      }
    ],
    "stages": [
      [
        "용융 공급",
        "Melt feed"
      ],
      [
        "버블 성형",
        "Bubble forming"
      ],
      [
        "냉각·인취",
        "Cool & haul off"
      ],
      [
        "접힘·권취",
        "Collapse & wind"
      ]
    ],
    "heightRatio": 0.64,
    "blender": "5.2.1 LTS",
    "groups": [
      "bubble",
      "flow",
      "haul",
      "screw",
      "winder"
    ]
  },
  "blowmolding": {
    "id": "blowmolding",
    "duration": 12,
    "poster": "assets/equipment/blowmolding-motion-poster.png",
    "model": "assets/equipment/blowmolding-motion.glb",
    "center": [
      -0.7,
      2.35,
      0
    ],
    "span": [
      11.6,
      6.1
    ],
    "controls": [
      {
        "key": "parison",
        "label": [
          "패리슨 토출 진행",
          "Parison extrusion progress"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          3
        ]
      },
      {
        "key": "mold",
        "label": [
          "금형 개방량",
          "Mold opening"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          4,
          3
        ]
      },
      {
        "key": "pin",
        "label": [
          "블로우 핀 삽입량",
          "Blow pin insertion"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          4,
          4.6
        ]
      },
      {
        "key": "inflate",
        "label": [
          "팽창 진행",
          "Inflation progress"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          4.6,
          6
        ]
      }
    ],
    "views": [
      {
        "key": "all",
        "label": [
          "전체 라인",
          "Whole line"
        ],
        "center": [
          -0.7,
          2.35,
          0
        ],
        "zoom": 1
      },
      {
        "key": "screw",
        "label": [
          "스크류·공급",
          "Screw & feed"
        ],
        "center": [
          -3.1,
          1.65,
          0
        ],
        "zoom": 2.1
      },
      {
        "key": "finish",
        "label": [
          "금형·블로우 핀",
          "Mold & blow pin"
        ],
        "center": [
          0.7,
          2.3,
          0
        ],
        "zoom": 1.9
      }
    ],
    "stages": [
      [
        "패리슨 토출",
        "Extrude parison"
      ],
      [
        "금형 닫힘·팽창",
        "Close & inflate"
      ],
      [
        "냉각",
        "Cool"
      ],
      [
        "핀 복귀·제품 배출",
        "Retract & discharge"
      ]
    ],
    "initial": {
      "parison": 0,
      "mold": 100,
      "pin": 0,
      "inflate": 0
    },
    "blender": "5.2.1 LTS",
    "groups": [
      "air",
      "flow",
      "inflate",
      "mold",
      "parison",
      "pin",
      "release",
      "screw"
    ]
  },
  "straw": {
    "id": "straw",
    "duration": 5,
    "poster": "assets/equipment/straw-motion-poster.webp",
    "model": "assets/equipment/straw-motion.glb",
    "center": [
      0.2,
      1.65,
      0
    ],
    "span": [
      18.0,
      5.0
    ],
    "controls": [
      {
        "key": "screw",
        "label": [
          "스크류 회전각",
          "Screw rotation angle"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          5
        ]
      },
      {
        "key": "flow",
        "label": [
          "수지 표시 위치",
          "Resin marker position"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          5
        ]
      },
      {
        "key": "haul",
        "label": [
          "벨트 순환 위치",
          "Belt loop position"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          5
        ]
      },
      {
        "key": "cutter",
        "label": [
          "절단날 회전각",
          "Cutter rotation angle"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          5
        ]
      }
    ],
    "views": [
      {
        "key": "all",
        "label": [
          "전체 라인",
          "Whole line"
        ],
        "center": [
          0.2,
          1.65,
          0
        ],
        "zoom": 1
      },
      {
        "key": "screw",
        "label": [
          "스크류·배럴",
          "Screw & barrel"
        ],
        "center": [
          -4.7,
          1.8,
          0
        ],
        "zoom": 2.3
      },
      {
        "key": "die",
        "label": [
          "환형 다이",
          "Annular die"
        ],
        "center": [
          -1,
          1.8,
          0
        ],
        "zoom": 4
      },
      {
        "key": "finish",
        "label": [
          "인취·절단",
          "Haul-off & cutter"
        ],
        "center": [
          6.1,
          1.9,
          0
        ],
        "zoom": 3.5
      }
    ],
    "stages": [
      [
        "공급·압출",
        "Feed & extrude"
      ],
      [
        "환형 다이·수조",
        "Annular die & baths"
      ],
      [
        "벨트 인취",
        "Belt haul-off"
      ],
      [
        "절단·배출",
        "Cut & discharge"
      ]
    ],
    "source": {
      "repository": "Yarn98/straw-optimizer-v2",
      "head": "91d3a22e284f9296aed668bfec9d55dd58553777",
      "basis": "user-authorized in-progress working-tree Blender snapshot",
      "sha256": "91b712018468ed304c4101eeaf5e57ffd6da8a2a5ef337e24ea0344ab3ee2bb1"
    },
    "amberFlow": true,
    "blender": "5.2.0 LTS",
    "groups": [
      "cutter",
      "flow",
      "haul",
      "screw"
    ]
  }
};
