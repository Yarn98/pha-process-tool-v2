/* Blender equipment control metadata. */
window.PHAEquipmentModels = {
  "extrusion": {
    "id": "extrusion",
    "duration": 10.0,
    "frames": [
      0,
      240
    ],
    "poster": "assets/equipment/extrusion-motion-poster.png",
    "model": "assets/equipment/extrusion-motion.glb",
    "center": [
      1.7725000000000002,
      0.95,
      0
    ],
    "span": [
      8.955,
      2.4
    ],
    "zoom": [
      0.7,
      12
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
          10.0
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
          10.0
        ]
      },
      {
        "key": "haul",
        "label": [
          "벨트 인취 풀리 회전각",
          "Belt haul-off pulley angle"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          10.0
        ]
      },
      {
        "key": "cutter",
        "label": [
          "플라잉 톱 사이클 위치",
          "Flying saw cycle position"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          10.0
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
          1.7725000000000002,
          0.95,
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
          -0.7,
          1.0,
          0
        ],
        "zoom": 3.2
      },
      {
        "key": "finish",
        "label": [
          "인취·절단",
          "Haul-off & saw"
        ],
        "center": [
          3.9,
          0.95,
          0
        ],
        "zoom": 3.0
      },
      {
        "key": "die",
        "label": [
          "다이·교정조",
          "Die & calibration"
        ],
        "center": [
          0.4,
          1.0,
          0
        ],
        "zoom": 5
      }
    ],
    "stages": [
      [
        "공급·용융",
        "Feed & melt"
      ],
      [
        "다이·교정",
        "Die & calibration"
      ],
      [
        "냉각·인취",
        "Cool & haul off"
      ],
      [
        "절단·배출",
        "Cut & discharge"
      ]
    ],
    "turns": {
      "screw": 10,
      "haul": 2,
      "cutter": 1
    },
    "cut_edges": 1,
    "study": {
      "rpm": 60.0,
      "speed": 3.0,
      "diameter": 80.0,
      "pitch": 500.0
    },
    "teaching": {
      "time_scale": 1,
      "rpm": {
        "screw": 60.0,
        "haul": 11.937,
        "cutter": 6.0
      },
      "line_speed_m_min": 3.0,
      "cut_length_mm": 500.0,
      "pulley_mm": 80.0,
      "loop_note": "Real time: one cut per 10 s loop; the pulleys turn a whole number of times per loop (within 0.6 %)."
    },
    "spec": {
      "basis": "Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA setting",
      "screw_d_mm": 45,
      "l_d": 30,
      "heating_zones": 5,
      "shaft_height_mm": 1000,
      "adapter_mm": 135,
      "profile": "tube 32 mm OD",
      "bath_m": 2.5,
      "haul_off_contact_mm": 500,
      "belt_width_mm": 100,
      "saw_travel_mm": 200.0,
      "cut_length_mm": 500.0,
      "run_out_mm": 1500,
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
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
    "duration": 15.708333333333334,
    "frames": [
      0,
      377
    ],
    "poster": "assets/equipment/sheet-motion-poster.png",
    "model": "assets/equipment/sheet-motion.glb",
    "center": [
      0.752,
      0.85,
      0
    ],
    "span": [
      6.814,
      2.4
    ],
    "zoom": [
      0.7,
      12
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
          15.708333333333334
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
          15.708333333333334
        ]
      },
      {
        "key": "roll",
        "label": [
          "3롤 스택 회전각 (250 mm)",
          "3-roll stack angle (250 mm)"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          15.708333333333334
        ]
      },
      {
        "key": "winder",
        "label": [
          "권취 롤 회전각",
          "Winder rotation angle"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          15.708333333333334
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
          0.752,
          0.85,
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
          -0.7,
          1.0,
          0
        ],
        "zoom": 3.2
      },
      {
        "key": "stack",
        "label": [
          "평다이·3롤 스택",
          "Flat die & 3-roll stack"
        ],
        "center": [
          0.48400000000000004,
          0.75,
          0
        ],
        "zoom": 4.5
      },
      {
        "key": "finish",
        "label": [
          "트림·인취·권취",
          "Trim, haul-off & winder"
        ],
        "center": [
          3.234,
          0.55,
          0
        ],
        "zoom": 3
      }
    ],
    "stages": [
      [
        "공급·용융",
        "Feed & melt"
      ],
      [
        "평다이·롤 접촉",
        "Flat die & roll contact"
      ],
      [
        "냉각·인취",
        "Cool & haul off"
      ],
      [
        "트림·권취",
        "Trim & wind"
      ]
    ],
    "turns": {
      "roll": 1,
      "winder": 1,
      "screw": 10
    },
    "study": {
      "rpm": 38.2,
      "speed": 3.0,
      "diameter": 250.0
    },
    "teaching": {
      "time_scale": 1,
      "line_speed_m_min": 3.0,
      "rpm": {
        "stack": 3.82,
        "table": 11.937,
        "haul": 7.958,
        "winder_at_250": 3.82,
        "winder_at_500": 1.91,
        "screw": 38.196
      },
      "roll_mm": {
        "stack": 250.0,
        "table": 80.0,
        "haul": 120.0,
        "winder_now": 250.0,
        "core": 76.0
      },
      "loop_note": "Real time: the 250 mm stack rolls turn once per loop; every roll keeps the same surface speed."
    },
    "spec": {
      "basis": "Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA setting",
      "screw_d_mm": 45,
      "l_d": 30,
      "flat_die_mm": "500 x 160 x 120",
      "lip_gap_mm": 1.0,
      "stack": "3 x 250 mm, face 600 mm",
      "web_path": "S-wrap: top-middle nip, middle roll, middle-bottom nip, bottom roll",
      "roller_table": "2000 mm, 80 mm rolls at 200 mm",
      "trim_mm_each_side": 15,
      "haul_off_mm": 120.0,
      "winder_core_mm": 76.0,
      "winder_max_mm": 500,
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
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
    "duration": 7.541666666666667,
    "frames": [
      0,
      181
    ],
    "poster": "assets/equipment/castfilm-motion-poster.png",
    "model": "assets/equipment/castfilm-motion.glb",
    "center": [
      0.4225000000000001,
      1.0,
      0
    ],
    "span": [
      6.754999999999999,
      2.6
    ],
    "zoom": [
      0.7,
      12
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
          7.541666666666667
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
          7.541666666666667
        ]
      },
      {
        "key": "roll",
        "label": [
          "칠 롤 회전각 (400 mm)",
          "Chill roll angle (400 mm)"
        ],
        "max": 720,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          7.541666666666667
        ]
      },
      {
        "key": "winder",
        "label": [
          "권취 롤 회전각",
          "Winder rotation angle"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          7.541666666666667
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
          0.4225000000000001,
          1.0,
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
          -1.0,
          1.55,
          0
        ],
        "zoom": 3.2
      },
      {
        "key": "chill",
        "label": [
          "다이·에어 갭·칠 롤",
          "Die, air gap & chill roll"
        ],
        "center": [
          0.55,
          1.0990384493975585,
          0
        ],
        "zoom": 4.5
      },
      {
        "key": "finish",
        "label": [
          "게이지·트림·권취",
          "Gauge, trim & winder"
        ],
        "center": [
          2.5,
          0.39783844939755847,
          0
        ],
        "zoom": 3
      }
    ],
    "stages": [
      [
        "공급·용융",
        "Feed & melt"
      ],
      [
        "에어 갭·칠 롤 고정",
        "Air gap & pinning"
      ],
      [
        "냉각·두께 측정",
        "Cool & gauge"
      ],
      [
        "트림·권취",
        "Trim & wind"
      ]
    ],
    "turns": {
      "roll": 1,
      "winder": 2,
      "screw": 8
    },
    "study": {
      "rpm": 63.6,
      "speed": 10.0,
      "diameter": 400.0
    },
    "teaching": {
      "time_scale": 1,
      "line_speed_m_min": 10.0,
      "air_gap_mm": 80.0,
      "landing_deg": 100,
      "rpm": {
        "chill": 7.958,
        "second": 15.915,
        "winder_at_76": 41.883,
        "winder_at_200": 15.915,
        "winder_at_500": 6.366,
        "screw": 63.646
      },
      "roll_mm": {
        "chill": 400.0,
        "second": 200.0,
        "third": 200.0,
        "guide": 100.0,
        "winder_now": 200.0,
        "core": 76.0
      },
      "loop_note": "Real time: the 400 mm chill roll turns once per loop and the 200 mm rolls twice; one surface speed."
    },
    "spec": {
      "basis": "Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA setting",
      "screw_d_mm": 45,
      "l_d": 30,
      "die_width_mm": 500,
      "air_gap_mm": 80,
      "rolls_mm": "400 / 200 / 200, face 600",
      "pinning": "air knife 550 mm",
      "chill_wrap_deg": 180,
      "gauge": "traversing O-frame 700 mm",
      "edge_trim": true,
      "winder": "76 mm core to 500 mm, dancer with load cells",
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
    "blender": "5.2.1 LTS",
    "groups": [
      "flow",
      "gauge",
      "roll",
      "screw",
      "winder"
    ]
  },
  "blownfilm": {
    "id": "blownfilm",
    "duration": 11.291666666666666,
    "frames": [
      0,
      271
    ],
    "poster": "assets/equipment/blownfilm-motion-poster.png",
    "model": "assets/equipment/blownfilm-motion.glb",
    "center": [
      -0.044999999999999846,
      1.9,
      0
    ],
    "span": [
      4.79,
      4.1
    ],
    "heightRatio": 0.62,
    "zoom": [
      0.7,
      12
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
          11.291666666666666
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
          11.291666666666666
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
          11.291666666666666
        ]
      },
      {
        "key": "winder",
        "label": [
          "권취 롤 회전각",
          "Winder rotation angle"
        ],
        "max": 360,
        "unit": "°",
        "step": 1,
        "range": [
          0,
          11.291666666666666
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
          -0.044999999999999846,
          1.9,
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
          -0.6,
          1.0,
          0
        ],
        "zoom": 3.2
      },
      {
        "key": "die",
        "label": [
          "환형 다이·에어링·동결선",
          "Annular die, air ring & frost line"
        ],
        "center": [
          0.55,
          1.25,
          0
        ],
        "zoom": 5
      },
      {
        "key": "finish",
        "label": [
          "접힘·닙롤",
          "Collapse & nip"
        ],
        "center": [
          0.55,
          3.25,
          0
        ],
        "zoom": 3.5
      }
    ],
    "stages": [
      [
        "용융 공급",
        "Melt feed"
      ],
      [
        "버블 성형·동결선",
        "Bubble & frost line"
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
    "turns": {
      "haul": 3,
      "winder": 2,
      "screw": 11
    },
    "study": {
      "rpm": 58.5,
      "speed": 5.0,
      "diameter": 100.0
    },
    "teaching": {
      "time_scale": 1,
      "line_speed_m_min": 5.0,
      "bur": 2.0,
      "die_mm": 80.0,
      "bubble_mm": 160.0,
      "layflat_mm": 251.3,
      "frost_line_mm": 320.0,
      "die_to_nip_mm": 2500,
      "collapsing_mm": 700,
      "cage_inside_mm": 200.0,
      "rpm": {
        "nip": 15.915,
        "winder_at_150": 10.61,
        "winder_at_450": 3.537,
        "screw": 58.45
      },
      "roll_mm": {
        "nip": 100.0,
        "guide": 100.0,
        "winder_now": 150.0,
        "core": 76.0
      },
      "loop_note": "Real time: steady bubble (no breathing); the nip rolls turn three times per loop and the winder twice."
    },
    "spec": {
      "basis": "Pack B grade C teaching values; brand-neutral; not an OEM drawing or a PHA BUR or frost-line setting",
      "screw_d_mm": 40,
      "l_d": 30,
      "die_mm": 80,
      "air_ring_od_mm": 240,
      "bur": 2.0,
      "layflat_mm": 251.3,
      "frost_line_mm": 320,
      "cage_inside_mm": 200,
      "die_to_nip_mm": 2500,
      "collapsing_mm": 700,
      "nip_mm": "100, face 350",
      "oscillating_haul_off": "optional, not shown",
      "ibc": "optional, not shown",
      "winder": "76 mm core to 450 mm, two-ply lay-flat",
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
    "blender": "5.2.1 LTS",
    "groups": [
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
