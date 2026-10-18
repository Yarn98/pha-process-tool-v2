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
          "압출 시작 · 스크류 회전",
          "Start extruding · screw"
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
        "key": "nip",
        "label": [
          "인취 벨트 닫힘 · 가압 실린더",
          "Close the belts · pressure cylinders"
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
          "인취 이송",
          "Haul-off draw"
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
        "key": "cutter",
        "label": [
          "첫 절단 · 플라잉 톱",
          "First cut · flying saw"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          10.0
        ]
      }
    ],
    "startup": {
      "intro": [
        "실제 라인의 기동 순서입니다. 스크류가 압출물을 다이 밖으로 밀어내면 작업자가 교정조와 수조를 지나 인취까지 끌어 넣고, 인취 벨트를 닫아 제품을 물린 뒤 절단기 너머로 보내 첫 절단을 합니다. 실제 라인은 존 온도가 설정값에 도달하고 균열(soak) 시간이 지나야 스크류가 기동되며(cold-start 보호), 모형은 그 이후부터 보여줍니다.",
        "The real start-up order: the screw pushes the extrudate out of the die, the operator leads it through the calibrator and bath into the haul-off, the belts close on it and draw it past the saw for the first cut. A real line only lets the screw start once every zone has reached its set point and soaked (cold-start protection); the model starts after that."
      ],
      "steps": [
        {
          "key": "screw",
          "label": [
            "압출 시작 · 스크류 회전",
            "Start extruding · screw"
          ],
          "hint": [
            "스크류를 돌려 압출물을 다이에서 교정조와 냉각 수조를 지나 인취 벨트 사이까지 보내세요. 실제로는 작업자가 손으로 끌어 넣습니다.",
            "Turn the screw to push the extrudate from the die through the calibrator and bath into the haul-off belts; on a real line the operator leads it by hand."
          ],
          "needs": [],
          "locks": [],
          "once": true,
          "spin": {
            "screw": [
              58.9,
              0
            ]
          },
          "thread": [
            0,
            2.945
          ]
        },
        {
          "key": "nip",
          "label": [
            "인취 벨트 닫힘 · 가압 실린더",
            "Close the belts · pressure cylinders"
          ],
          "hint": [
            "압출물이 벨트 사이에 들어왔습니다. 가압 실린더로 상부 벨트를 내려 제품을 무세요.",
            "The extrudate is between the belts. Lower the upper belt with the pressure cylinders to grip it."
          ],
          "needs": [
            "screw"
          ],
          "locks": [],
          "once": false,
          "move": "nip"
        },
        {
          "key": "haul",
          "label": [
            "인취 이송",
            "Haul-off draw"
          ],
          "hint": [
            "벨트가 제품을 물었습니다. 인취를 돌려 제품을 플라잉 톱 너머 배출대까지 보내세요. 인취가 시작되면 벨트를 열 수 없습니다.",
            "The belts grip the profile. Run the haul-off to draw it past the flying saw onto the run-out table; the belts stay closed once hauling starts."
          ],
          "needs": [
            "nip"
          ],
          "locks": [
            "nip"
          ],
          "once": true,
          "spin": {
            "haul": [
              5.1725,
              0
            ],
            "screw": [
              26.0,
              0
            ]
          },
          "thread": [
            2.945,
            4.245
          ]
        },
        {
          "key": "cutter",
          "label": [
            "첫 절단 · 플라잉 톱",
            "First cut · flying saw"
          ],
          "hint": [
            "제품이 배출대에 올라왔습니다. 플라잉 톱 한 사이클로 첫 절단을 하세요. 톱은 제품을 물고 같은 속도로 이동하며 자릅니다.",
            "The profile is on the run-out table. Run one flying-saw cycle for the first cut; the saw clamps the profile and travels with it while it cuts."
          ],
          "needs": [
            "haul"
          ],
          "locks": [],
          "once": true,
          "spin": {
            "haul": [
              2,
              0
            ],
            "screw": [
              10,
              0
            ]
          },
          "move": "cutter",
          "release": {
            "node": "FirstPiece",
            "at": 0.2,
            "cut_s": 3.745,
            "path": [
              [
                4.35,
                1.0,
                0
              ],
              [
                5.7,
                1.0,
                0
              ],
              [
                5.7,
                0.62,
                0.3
              ]
            ]
          }
        }
      ],
      "done": [
        "기동 완료 · \"자동 공정으로 돌아가기\"를 누르면 정상 운전(3 m/min)을 재생합니다.",
        "Start-up complete. Choose \"Return to cycle\" to play steady running at 3 m/min."
      ],
      "pinned": {
        "nip": 1
      },
      "hidden": [
        "flow"
      ],
      "follow": {
        "resin": "screw"
      }
    },
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
          "스크류·배럴 단면",
          "Screw & barrel cutaway"
        ],
        "center": [
          -0.7,
          1.0,
          0
        ],
        "zoom": 3.4,
        "position": [
          0.5,
          6.2,
          6.0
        ]
      },
      {
        "key": "die",
        "label": [
          "다이·교정조",
          "Die & calibration"
        ],
        "center": [
          0.3,
          1.0,
          0
        ],
        "zoom": 6,
        "position": [
          1.8,
          4.0,
          6.0
        ]
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
        "zoom": 4,
        "position": [
          5.4,
          3.95,
          6.0
        ]
      }
    ],
    "heat": {
      "input": "process",
      "reference": "process",
      "title": [
        "배럴·다이 존 온도 (입력한 설정값)",
        "Barrel and die zone temperatures (entered set points)"
      ],
      "note": [
        "공정 조건에 입력한 존 설정값을 색으로 표시합니다. 실측·용융온도가 아니며, 존 번호는 호퍼 쪽부터 다이 방향입니다. 참고 범위는 선택한 그레이드의 근거 또는 사용자 수정 범위입니다. 굵은 테두리는 범위 밖, 빗금은 미입력입니다.",
        "Colours show the zone set points entered under process conditions, not measured or melt temperatures; zones are numbered from the hopper toward the die. Reference bands come from the selected grade source or your edits; a heavy outline marks values outside the band and hatching marks missing values."
      ],
      "scale_labels": {
        "melt": [
          "배럴·다이",
          "Barrel & die"
        ],
        "tool": [
          "냉각",
          "Cooling"
        ]
      },
      "zones": [
        {
          "key": "Z1",
          "field": "zone1",
          "label": [
            "존 1",
            "Zone 1"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -1.27035,
            -1.02465
          ],
          "r": 0.0615,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z2",
          "field": "zone2",
          "label": [
            "존 2",
            "Zone 2"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.95535,
            -0.70965
          ],
          "r": 0.0615,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z3",
          "field": "zone3",
          "label": [
            "존 3",
            "Zone 3"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.64035,
            -0.39465
          ],
          "r": 0.0615,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z4",
          "field": "zone4",
          "label": [
            "존 4",
            "Zone 4"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.32535,
            -0.07965
          ],
          "r": 0.0615,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "die",
          "field": "die",
          "label": [
            "다이",
            "Die"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            0.145,
            0.325
          ],
          "r": 0.078,
          "center": [
            1.0,
            0.0
          ],
          "parent": null,
          "full": true
        }
      ]
    },
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
      "heating_zones": 4,
      "shaft_height_mm": 1000,
      "adapter_mm": 135,
      "profile": "tube 32 mm OD",
      "bath_m": 2.5,
      "haul_off_contact_mm": 500,
      "belt_width_mm": 100,
      "saw_travel_mm": 200.0,
      "cut_length_mm": 500.0,
      "run_out_mm": 1500,
      "threading_lift_mm": 45.0,
      "pressure_cylinders": 2,
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
    "blender": "5.2.1 LTS",
    "groups": [
      "cutter",
      "flow",
      "haul",
      "nip",
      "resin",
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
          "압출 시작 · 주 스크류",
          "Start extruding · main screws"
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
        "key": "side",
        "label": [
          "사이드 피더 기동",
          "Start the side feeder"
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
        "key": "cutter",
        "label": [
          "커터 로터 기동",
          "Start the cutter rotor"
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
        "key": "nip",
        "label": [
          "피드 롤 가압 · 실린더",
          "Close the feed rolls · loading cylinders"
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
          "피드 롤 이송 · 첫 펠릿",
          "Feed the strands · first pellets"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          25.125
        ]
      }
    ],
    "startup": {
      "intro": [
        "실제 라인의 기동 순서입니다. 주 스크류가 스트랜드를 다이 밖으로 밀어내면 작업자가 냉각 수조와 에어 나이프를 지나 펠릿타이저 입구까지 끌어 넣고, 커터 로터를 먼저 돌린 뒤 상부 피드 롤을 내려 스트랜드를 물리고 이송해 첫 펠릿을 만듭니다. 사이드 피더는 주 스크류가 도는 동안에만 기동합니다. 실제 라인은 블록 온도가 설정값에 도달하고 균열(soak) 시간이 지나야 스크류가 기동되며(cold-start 보호), 모형은 그 이후부터 보여줍니다.",
        "The real start-up order: the main screws push the strands out of the die and the operator leads them through the water bath and air knife to the pelletiser inlet; the cutter rotor is started first, then the upper feed roll is lowered onto the strands and they are fed in for the first pellets. The side feeder only starts while the main screws turn. A real line only lets the screws start once every block has reached its set point and soaked (cold-start protection); the model starts after that."
      ],
      "steps": [
        {
          "key": "screw",
          "label": [
            "압출 시작 · 주 스크류",
            "Start extruding · main screws"
          ],
          "hint": [
            "주 스크류를 돌려 스트랜드 6가닥을 다이에서 냉각 수조와 에어 나이프를 지나 피드 롤 사이까지 보내세요. 실제로는 작업자가 손으로 수조의 가이드 롤 아래로 끌어 넣습니다.",
            "Turn the main screws to push the six strands from the die through the water bath and air knife to the feed rolls; on a real line the operator leads them under the bath guide rolls by hand."
          ],
          "needs": [],
          "locks": [],
          "once": true,
          "spin": {
            "screw": [
              60.3885,
              0
            ]
          },
          "thread": [
            0,
            3.01942
          ]
        },
        {
          "key": "side",
          "label": [
            "사이드 피더 기동",
            "Start the side feeder"
          ],
          "hint": [
            "스트랜드가 나오고 있습니다. 사이드 피더를 돌려 B5로 부원료를 넣으세요. 사이드 피더는 주 스크류가 도는 동안에만 기동합니다.",
            "The strands are running. Turn the side feeder to add the second component at B5; it only starts while the main screws turn."
          ],
          "needs": [
            "screw"
          ],
          "locks": [],
          "once": true,
          "spin": {
            "side": [
              3.0,
              0
            ],
            "screw": [
              6.0,
              0
            ]
          }
        },
        {
          "key": "cutter",
          "label": [
            "커터 로터 기동",
            "Start the cutter rotor"
          ],
          "hint": [
            "스트랜드를 넣기 전에 커터 로터를 먼저 돌리세요. 로터가 돌지 않으면 피드 롤을 닫을 수 없습니다.",
            "Start the cutter rotor before feeding the strands; the feed rolls cannot close until it turns."
          ],
          "needs": [
            "screw"
          ],
          "locks": [],
          "once": true,
          "spin": {
            "cutter": [
              8.3333,
              0
            ],
            "screw": [
              4.0,
              0
            ]
          }
        },
        {
          "key": "nip",
          "label": [
            "피드 롤 가압 · 실린더",
            "Close the feed rolls · loading cylinders"
          ],
          "hint": [
            "로터가 돌고 있습니다. 가압 실린더로 상부 피드 롤을 내려 스트랜드를 물리세요.",
            "The rotor is turning. Lower the upper feed roll with the loading cylinders to grip the strands."
          ],
          "needs": [
            "screw",
            "cutter"
          ],
          "locks": [],
          "once": false,
          "move": "nip"
        },
        {
          "key": "haul",
          "label": [
            "피드 롤 이송 · 첫 펠릿",
            "Feed the strands · first pellets"
          ],
          "hint": [
            "피드 롤이 스트랜드를 물었습니다. 피드 롤을 돌려 스트랜드를 커터로 보내 첫 펠릿을 만드세요. 이송이 시작되면 피드 롤을 열 수 없습니다.",
            "The feed rolls grip the strands. Turn them to feed the strands into the cutter for the first pellets; the rolls stay closed once feeding starts."
          ],
          "needs": [
            "nip"
          ],
          "locks": [
            "nip"
          ],
          "once": true,
          "spin": {
            "haul": [
              2.3873,
              0
            ],
            "cutter": [
              25.0,
              0
            ],
            "screw": [
              12.0,
              0
            ]
          },
          "thread": [
            3.01942,
            3.08943
          ],
          "release": {
            "node": "FirstPellets",
            "at": 0.1,
            "path": [
              [
                4.46768,
                0.95085,
                0
              ],
              [
                4.45,
                0.76,
                0
              ],
              [
                4.45,
                0.69,
                0
              ],
              [
                4.75,
                0.66,
                0
              ],
              [
                5.05,
                0.63,
                0
              ],
              [
                5.35,
                0.592,
                0
              ]
            ]
          }
        }
      ],
      "done": [
        "기동 완료 · \"자동 공정으로 돌아가기\"를 누르면 정상 운전(0.1배 교육 속도)을 재생합니다.",
        "Start-up complete. Choose \"Return to cycle\" to play steady running at the 0.1x teaching speed."
      ],
      "pinned": {
        "nip": 1
      },
      "hidden": [
        "flow"
      ],
      "follow": {
        "resin": "screw"
      }
    },
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
          "스크류·배럴 단면",
          "Screws & barrel cutaway"
        ],
        "center": [
          0.64,
          1.0,
          0
        ],
        "zoom": 6,
        "position": [
          1.64,
          6.2,
          5.0
        ]
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
        "zoom": 2.2,
        "position": [
          5.4,
          3.45,
          6.0
        ]
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
        "zoom": 9,
        "position": [
          5.41,
          2.5,
          6.0
        ]
      }
    ],
    "heat": {
      "input": "panel",
      "reference": null,
      "title": [
        "배럴 블록·다이 설정 온도 (여기서 입력)",
        "Barrel block and die set points (enter here)"
      ],
      "note": [
        "이축 컴파운딩의 그레이드별 온도 근거는 확립되지 않아 참고 범위를 표시하지 않습니다. 장비 도면과 그레이드 TDS로 각 블록을 대응한 뒤 설정값을 입력하면 색으로 비교합니다. 입력값은 이 브라우저에만 저장되며 실측 온도가 아닙니다. B1은 수냉 공급부입니다.",
        "No grade-specific temperature basis is established for twin-screw compounding, so no reference band is shown. Map each block with the machine drawing and grade TDS, then enter set points to compare them by colour. Entries stay in this browser and are not measured temperatures. B1 is the water-cooled feed block."
      ],
      "scale_labels": {
        "melt": [
          "배럴 블록·다이",
          "Barrel blocks & die"
        ],
        "tool": [
          "냉각",
          "Cooling"
        ]
      },
      "zones": [
        {
          "key": "B2",
          "field": "B2",
          "label": [
            "B2",
            "B2"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            0.132,
            0.937,
            -0.074
          ],
          "max": [
            0.252,
            1.063,
            -0.03276
          ]
        },
        {
          "key": "B3",
          "field": "B3",
          "label": [
            "B3",
            "B3"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            0.26,
            0.937,
            -0.074
          ],
          "max": [
            0.38,
            1.063,
            -0.03276
          ]
        },
        {
          "key": "B4",
          "field": "B4",
          "label": [
            "B4",
            "B4"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            0.388,
            0.937,
            -0.074
          ],
          "max": [
            0.508,
            1.063,
            -0.03276
          ]
        },
        {
          "key": "B5",
          "field": "B5",
          "label": [
            "B5",
            "B5"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            0.516,
            0.937,
            -0.074
          ],
          "max": [
            0.636,
            1.063,
            -0.03276
          ]
        },
        {
          "key": "B6",
          "field": "B6",
          "label": [
            "B6",
            "B6"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            0.644,
            0.937,
            -0.074
          ],
          "max": [
            0.764,
            1.063,
            -0.03276
          ]
        },
        {
          "key": "B7",
          "field": "B7",
          "label": [
            "B7",
            "B7"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            0.772,
            0.937,
            -0.074
          ],
          "max": [
            0.892,
            1.063,
            -0.03276
          ]
        },
        {
          "key": "B8",
          "field": "B8",
          "label": [
            "B8",
            "B8"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            0.9,
            0.937,
            -0.074
          ],
          "max": [
            1.02,
            1.063,
            -0.03276
          ]
        },
        {
          "key": "B9",
          "field": "B9",
          "label": [
            "B9",
            "B9"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            1.028,
            0.937,
            -0.074
          ],
          "max": [
            1.148,
            1.063,
            -0.03276
          ]
        },
        {
          "key": "B10",
          "field": "B10",
          "label": [
            "B10",
            "B10"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            1.156,
            0.937,
            -0.074
          ],
          "max": [
            1.276,
            1.063,
            -0.03276
          ]
        },
        {
          "key": "adapter",
          "field": "die",
          "label": [
            "어댑터·다이",
            "Adapter & die"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            1.285,
            1.371
          ],
          "r": 0.072,
          "center": [
            1.0,
            0.0
          ],
          "parent": null,
          "full": true
        },
        {
          "key": "die",
          "field": "die",
          "label": [
            "어댑터·다이",
            "Adapter & die"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            1.374,
            0.954,
            -0.083
          ],
          "max": [
            1.468,
            1.046,
            0.083
          ]
        }
      ]
    },
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
      "press_roll_lift_mm": 25.0,
      "loading_cylinders": 2,
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
    "blender": "5.2.1 LTS",
    "groups": [
      "cutter",
      "flow",
      "haul",
      "nip",
      "resin",
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
          "압출 시작 · 스크류 회전",
          "Start extruding · screw"
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
        "key": "nip",
        "label": [
          "롤 갭 닫힘 · 유압 실린더",
          "Close the roll gap · hydraulic cylinders"
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
        "key": "gap",
        "label": [
          "하단 롤 갭 설정 · 갭 조정기",
          "Set the bottom roll gap · gap adjusters"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          15.708333333333334
        ],
        "readout": {
          "from": 11.0,
          "to": 1.0,
          "unit": "mm",
          "digits": 1
        }
      },
      {
        "key": "roll",
        "label": [
          "롤 스택 이송",
          "Draw with the roll stack"
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
        "key": "winder",
        "label": [
          "권취 시작",
          "Start winding"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          15.708333333333334
        ]
      }
    ],
    "startup": {
      "intro": [
        "실제 라인의 기동 순서입니다. 롤 갭을 연 상태에서 스크류가 용융 시트를 평다이 밖으로 밀어내 상단과 중단 롤 사이로 넣고, 유압 실린더로 상단 롤을 내려 갭을 닫고, 갭 조정기로 하단 롤을 올려 중단·하단 롤 갭을 맞춘 뒤 롤 스택을 돌려 시트를 S자로 감아 롤러 테이블, 트림, 인취를 거쳐 권취기까지 보내고 권취를 시작합니다. 실제 라인은 존과 롤 온도가 설정값에 도달하고 균열(soak) 시간이 지나야 스크류가 기동되며(cold-start 보호), 모형은 그 이후부터 보여줍니다.",
        "The real start-up order: with the roll gaps open, the screw pushes the melt sheet out of the flat die between the top and middle rolls; the hydraulic cylinders lower the top roll to close the gap, the gap adjusters raise the bottom roll to set the middle-bottom gap, the stack draws the sheet through its S-wrap over the roller table, trim and haul-off to the winder, and winding starts. A real line only lets the screw start once every zone and roll has reached its set point and soaked (cold-start protection); the model starts after that."
      ],
      "steps": [
        {
          "key": "screw",
          "label": [
            "압출 시작 · 스크류 회전",
            "Start extruding · screw"
          ],
          "hint": [
            "스크류를 돌려 용융 시트를 평다이에서 열린 상단·중단 롤 사이로 보내세요.",
            "Turn the screw to push the melt sheet from the flat die into the open gap between the top and middle rolls."
          ],
          "needs": [],
          "locks": [],
          "once": true,
          "spin": {
            "screw": [
              1.2732,
              0
            ]
          },
          "thread": [
            0,
            0.1
          ]
        },
        {
          "key": "nip",
          "label": [
            "롤 갭 닫힘 · 유압 실린더",
            "Close the roll gap · hydraulic cylinders"
          ],
          "hint": [
            "시트가 롤 사이에 들어왔습니다. 유압 실린더로 상단 롤을 내려 갭을 닫으세요. 롤 갭은 제품 두께와 같지 않으며 실제로는 두께를 보며 맞춥니다.",
            "The sheet is between the rolls. Lower the top roll with the hydraulic cylinders to close the gap; the roll gap is not the product thickness and is set while watching the gauge."
          ],
          "needs": [
            "screw"
          ],
          "locks": [],
          "once": false,
          "move": "nip"
        },
        {
          "key": "gap",
          "label": [
            "하단 롤 갭 설정 · 갭 조정기",
            "Set the bottom roll gap · gap adjusters"
          ],
          "hint": [
            "상단 갭이 닫혔습니다. 양쪽 갭 조정기의 유압 실린더로 하단 롤을 올려 쐐기 스토퍼에 붙이세요. 중단·하단 롤 갭이 11 mm에서 모형의 1 mm까지 줄어듭니다. 쐐기 위치는 스핀들 핸들로 정하며, 실제 갭은 제품 두께와 같지 않고 두께를 보며 맞춥니다.",
            "The top gap is closed. Raise the bottom roll with the hydraulic cylinders of both gap adjusters until its bearing blocks rest on the wedge stops; the middle-bottom gap closes from 11 mm to the model's 1 mm. The spindle handwheel sets the wedge; a real gap is not the product thickness and is set while watching the gauge."
          ],
          "needs": [
            "nip"
          ],
          "locks": [],
          "once": false,
          "move": "gap",
          "readout": {
            "from": 11.0,
            "to": 1.0,
            "unit": "mm",
            "digits": 1
          }
        },
        {
          "key": "roll",
          "label": [
            "롤 스택 이송",
            "Draw with the roll stack"
          ],
          "hint": [
            "두 갭이 닫혔습니다. 롤 스택을 돌려 시트를 S자로 감아 롤러 테이블, 트림, 인취를 거쳐 권취기까지 보내세요. 이송이 시작되면 갭을 열 수 없습니다.",
            "Both gaps are closed. Run the stack to draw the sheet through its S-wrap over the roller table, trim and haul-off to the winder; the gaps stay closed once drawing starts."
          ],
          "needs": [
            "gap"
          ],
          "locks": [
            "nip",
            "gap"
          ],
          "once": true,
          "spin": {
            "roll": [
              5.3088,
              0
            ],
            "screw": [
              53.0871,
              0
            ]
          },
          "thread": [
            0.1,
            4.26955
          ]
        },
        {
          "key": "winder",
          "label": [
            "권취 시작",
            "Start winding"
          ],
          "hint": [
            "시트가 권취 코어에 닿았습니다. 권취기를 돌려 감으세요. 모형은 76 mm 코어에서 250 mm 권취 롤까지를 압축해 보여줍니다.",
            "The sheet has reached the winder core. Turn the winder to wind it; the model compresses the growth from the 76 mm core to a 250 mm roll."
          ],
          "needs": [
            "roll"
          ],
          "locks": [],
          "once": true,
          "spin": {
            "winder": [
              3.9056,
              0
            ],
            "roll": [
              2.5465,
              0
            ],
            "screw": [
              25.4642,
              0
            ]
          },
          "wind": {
            "node": "Winder_body",
            "core": 0.304
          }
        }
      ],
      "done": [
        "기동 완료 · \"자동 공정으로 돌아가기\"를 누르면 정상 운전(3 m/min)을 재생합니다.",
        "Start-up complete. Choose \"Return to cycle\" to play steady running at 3 m/min."
      ],
      "pinned": {
        "nip": 1,
        "gap": 1
      },
      "hidden": [
        "flow"
      ],
      "follow": {
        "resin": "screw"
      }
    },
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
          "스크류·배럴 단면",
          "Screw & barrel cutaway"
        ],
        "center": [
          -0.7,
          1.0,
          0
        ],
        "zoom": 3.4,
        "position": [
          0.5,
          6.2,
          6.0
        ]
      },
      {
        "key": "stack",
        "label": [
          "평다이·3롤 스택",
          "Flat die & 3-roll stack"
        ],
        "center": [
          0.484,
          0.78,
          0
        ],
        "zoom": 4.5,
        "position": [
          0.984,
          1.68,
          8.0
        ]
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
        "zoom": 3,
        "position": [
          4.734,
          3.05,
          6.0
        ]
      }
    ],
    "heat": {
      "input": "process",
      "reference": "process",
      "title": [
        "배럴·다이 존 온도 (입력한 설정값)",
        "Barrel and die zone temperatures (entered set points)"
      ],
      "note": [
        "공정 조건에 입력한 존 설정값을 색으로 표시합니다. 실측·용융온도가 아니며, 존 번호는 호퍼 쪽부터 다이 방향입니다. 참고 범위는 선택한 그레이드의 근거 또는 사용자 수정 범위입니다. 굵은 테두리는 범위 밖, 빗금은 미입력입니다.",
        "Colours show the zone set points entered under process conditions, not measured or melt temperatures; zones are numbered from the hopper toward the die. Reference bands come from the selected grade source or your edits; a heavy outline marks values outside the band and hatching marks missing values."
      ],
      "scale_labels": {
        "melt": [
          "배럴·다이",
          "Barrel & die"
        ],
        "tool": [
          "칠 롤",
          "Chill rolls"
        ]
      },
      "zones": [
        {
          "key": "Z1",
          "field": "zone1",
          "label": [
            "존 1",
            "Zone 1"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -1.27728,
            -1.08072
          ],
          "r": 0.0615,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z2",
          "field": "zone2",
          "label": [
            "존 2",
            "Zone 2"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -1.02528,
            -0.82872
          ],
          "r": 0.0615,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z3",
          "field": "zone3",
          "label": [
            "존 3",
            "Zone 3"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.77328,
            -0.57672
          ],
          "r": 0.0615,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z4",
          "field": "zone4",
          "label": [
            "존 4",
            "Zone 4"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.52128,
            -0.32472
          ],
          "r": 0.0615,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z5",
          "field": "zone5",
          "label": [
            "존 5",
            "Zone 5"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.26928,
            -0.07272
          ],
          "r": 0.0615,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "die",
          "field": "die",
          "label": [
            "평다이",
            "Flat die"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            0.247,
            0.934,
            -0.262
          ],
          "max": [
            0.413,
            1.066,
            0.262
          ]
        },
        {
          "key": "chill_top",
          "field": "chillTop",
          "label": [
            "상단 롤",
            "Top roll"
          ],
          "group": "tool",
          "shape": "roll_ends",
          "x": 0.534,
          "y": 1.1255,
          "r": 0.129,
          "z": [
            -0.3,
            0.3
          ],
          "width": 0.04
        },
        {
          "key": "chill_mid",
          "field": "chillMid",
          "label": [
            "중단 롤",
            "Middle roll"
          ],
          "group": "tool",
          "shape": "roll_ends",
          "x": 0.534,
          "y": 0.8745,
          "r": 0.129,
          "z": [
            -0.3,
            0.3
          ],
          "width": 0.04
        },
        {
          "key": "chill_bot",
          "field": "chillBot",
          "label": [
            "하단 롤",
            "Bottom roll"
          ],
          "group": "tool",
          "shape": "roll_ends",
          "x": 0.534,
          "y": 0.6235,
          "r": 0.129,
          "z": [
            -0.3,
            0.3
          ],
          "width": 0.04
        }
      ]
    },
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
      "bottom_gap_mm": {
        "open": 11.0,
        "set": 1.0
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
      "gap_threading_mm": 30.0,
      "gap_cylinders": 2,
      "bottom_gap_adjusters": {
        "per_side": "vertical hydraulic cylinder under the bottom roll bearing block, wedge stop under the middle roll block, wedge spindle with handwheel and scale",
        "threading_open_mm": 10.0,
        "set_gap_mm": 1.0,
        "note": "model gap = lip-gap example; a real gap is set on the gauge and is not the product thickness",
        "grade": "C teaching values; not an OEM drawing"
      },
      "haul_off_mm": 120.0,
      "winder_core_mm": 76.0,
      "winder_max_mm": 500,
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
    "blender": "5.2.1 LTS",
    "groups": [
      "flow",
      "gap",
      "nip",
      "resin",
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
          "압출 시작 · 스크류 회전",
          "Start extruding · screw"
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
        "key": "nip",
        "label": [
          "에어 나이프 접근 · 실린더",
          "Bring in the air knife · cylinders"
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
          "롤 이송",
          "Draw with the rolls"
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
        "key": "tension",
        "label": [
          "권취 장력 걸기 · 댄서",
          "Take up the tension · dancer"
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
        "key": "winder",
        "label": [
          "권취 시작",
          "Start winding"
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
        "key": "turret",
        "label": [
          "권취 교체 · 터릿 180° 인덱싱",
          "Change the roll · turret 180° index"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          7.541666666666667
        ]
      }
    ],
    "startup": {
      "intro": [
        "실제 라인의 기동 순서입니다. 스크류가 용융 커튼을 평다이 밖으로 밀어내 에어 갭을 지나 도는 칠 롤 위에 떨어뜨리면, 에어 나이프를 실린더로 밀어 넣어 커튼을 칠 롤에 밀착(pinning)시키고, 롤을 돌려 필름을 두께 측정, 트림, 댄서를 거쳐 권취기까지 보낸 뒤 장력을 걸어 댄서를 작동 위치로 올리고 권취를 시작합니다. 롤이 차면 터릿을 돌려 라인을 멈추지 않고 롤을 교체합니다. 실제 라인은 존과 칠 롤 온도가 설정값에 도달하고 균열(soak) 시간이 지나야 스크류가 기동되며(cold-start 보호), 모형은 그 이후부터 보여줍니다.",
        "The real start-up order: the screw pushes the melt curtain out of the flat die through the air gap onto the turning chill roll; the cylinders push the air knife in to pin the curtain to the roll, the rolls draw the film through the gauge, trim and dancer to the winder, the tension lifts the dancer to its working position, and winding starts. When the roll is full, the turret changes it without stopping the line. A real line only lets the screw start once every zone and the chill roll have reached their set points and soaked (cold-start protection); the model starts after that."
      ],
      "steps": [
        {
          "key": "screw",
          "label": [
            "압출 시작 · 스크류 회전",
            "Start extruding · screw"
          ],
          "hint": [
            "스크류를 돌려 용융 커튼을 평다이에서 에어 갭을 지나 칠 롤 위 착지선까지 내려보내세요.",
            "Turn the screw to let the melt curtain fall from the flat die through the air gap onto the landing line of the chill roll."
          ],
          "needs": [],
          "locks": [],
          "once": true,
          "spin": {
            "screw": [
              0.5067,
              0
            ]
          },
          "thread": [
            0,
            0.07961
          ]
        },
        {
          "key": "nip",
          "label": [
            "에어 나이프 접근 · 실린더",
            "Bring in the air knife · cylinders"
          ],
          "hint": [
            "커튼이 칠 롤에 닿았습니다. 실린더로 에어 나이프를 밀어 넣어 착지선에서 커튼을 롤에 밀착시키세요. 밀착이 약하면 필름과 롤 사이에 공기가 갇혀 냉각이 고르지 않습니다.",
            "The curtain touches the chill roll. Push the air knife in with the cylinders to pin it on the landing line; weak pinning traps air between film and roll and cools it unevenly."
          ],
          "needs": [
            "screw"
          ],
          "locks": [],
          "once": false,
          "move": "nip"
        },
        {
          "key": "roll",
          "label": [
            "롤 이송",
            "Draw with the rolls"
          ],
          "hint": [
            "커튼이 칠 롤에 밀착되었습니다. 롤을 돌려 필름을 2·3번 롤, 두께 측정, 트림, 댄서를 거쳐 권취기까지 보내세요. 이송이 시작되면 에어 나이프를 뺄 수 없습니다.",
            "The curtain is pinned. Run the rolls to draw the film over the second and third rolls, gauge, trim and dancer to the winder; the air knife stays in once drawing starts."
          ],
          "needs": [
            "nip"
          ],
          "locks": [
            "nip"
          ],
          "once": true,
          "spin": {
            "roll": [
              2.9215,
              0
            ],
            "screw": [
              23.3663,
              0
            ]
          },
          "thread": [
            0.07961,
            3.75087
          ]
        },
        {
          "key": "tension",
          "label": [
            "권취 장력 걸기 · 댄서",
            "Take up the tension · dancer"
          ],
          "hint": [
            "필름이 권취 코어에 닿았습니다. 권취기를 천천히 돌려 늘어진 필름을 감으세요. 장력이 생기면 댄서 롤이 하한 스토퍼에서 작동 위치까지 25 mm 올라오고, 필름 루프가 그만큼 짧아집니다. 이후에는 댄서 위치 센서가 권취 속도를 보정해 이 위치를 유지하며, 장력이 변하면 댄서가 오르내려 받아냅니다.",
            "The film has reached the winder core. Turn the winder slowly to take up the slack. As the tension builds, the dancer roll rises 25 mm from its lower stops to the working position and the film loop shortens with it. From then on the dancer position sensor trims the winder speed to hold that position, and the dancer rises or falls to absorb tension changes."
          ],
          "needs": [
            "roll"
          ],
          "locks": [],
          "once": false,
          "spin": {
            "winder": [
              0.144,
              0
            ]
          },
          "move": "dancer",
          "morph": "dancer"
        },
        {
          "key": "winder",
          "label": [
            "권취 시작",
            "Start winding"
          ],
          "hint": [
            "댄서가 작동 위치에 섰습니다. 권취기를 돌려 감으세요. 모형은 76 mm 코어에서 200 mm 권취 롤까지를 압축해 보여줍니다.",
            "The dancer stands at its working position. Turn the winder to wind the film; the model compresses the growth from the 76 mm core to a 200 mm roll."
          ],
          "needs": [
            "tension"
          ],
          "locks": [
            "tension"
          ],
          "once": true,
          "spin": {
            "winder": [
              6.9198,
              0
            ],
            "roll": [
              2.3873,
              0
            ],
            "screw": [
              19.0939,
              0
            ]
          },
          "wind": {
            "node": "Winder_body",
            "core": 0.38
          }
        },
        {
          "key": "turret",
          "label": [
            "권취 교체 · 터릿 180° 인덱싱",
            "Change the roll · turret 180° index"
          ],
          "hint": [
            "권취 롤이 찼습니다. 라인을 멈추지 않고 터릿을 180° 돌려, 다 감긴 롤은 아래로 돌아 대기 위치로 가고 빈 코어는 위로 넘어와 권취 위치에 서게 하세요. 실제 권취기는 이때 새 코어에 필름을 붙이고 잘라 넘깁니다. 모형은 절단·전사를 생략하므로 필름 끝은 새 코어 위에서 기다립니다.",
            "The roll is full. Without stopping the line, index the turret 180°: the full roll swings down to the standby position and the empty core comes over the top to the winding position. A real winder now lays the film onto the new core and cuts it; the model leaves out the cut and transfer, so the film end waits above the new core."
          ],
          "needs": [
            "winder"
          ],
          "locks": [
            "winder"
          ],
          "once": true,
          "spin": {
            "roll": [
              0.7958,
              0
            ],
            "screw": [
              6.3646,
              0
            ],
            "winder": [
              1.5915,
              0
            ]
          },
          "move": "turret"
        }
      ],
      "done": [
        "기동 완료 · \"자동 공정으로 돌아가기\"를 누르면 정상 운전(10 m/min)을 재생합니다.",
        "Start-up complete. Choose \"Return to cycle\" to play steady running at 10 m/min."
      ],
      "pinned": {
        "nip": 1,
        "dancer": 1,
        "turret": 0
      },
      "hidden": [
        "flow"
      ],
      "follow": {
        "resin": "screw"
      }
    },
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
          "스크류·배럴 단면",
          "Screw & barrel cutaway"
        ],
        "center": [
          -1.0,
          1.55,
          0
        ],
        "zoom": 3.4,
        "position": [
          0.2,
          6.75,
          6.0
        ]
      },
      {
        "key": "chill",
        "label": [
          "다이·에어 갭·칠 롤",
          "Die, air gap & chill roll"
        ],
        "center": [
          0.55,
          1.119,
          0
        ],
        "zoom": 4.5,
        "position": [
          1.05,
          2.019,
          8.0
        ]
      },
      {
        "key": "finish",
        "label": [
          "게이지·트림·권취",
          "Gauge, trim & winder"
        ],
        "center": [
          2.5,
          0.3978,
          0
        ],
        "zoom": 3,
        "position": [
          4.0,
          2.8978,
          6.0
        ]
      }
    ],
    "heat": {
      "input": "process",
      "reference": "process",
      "title": [
        "배럴·다이 존 온도 (입력한 설정값)",
        "Barrel and die zone temperatures (entered set points)"
      ],
      "note": [
        "공정 조건에 입력한 존 설정값을 색으로 표시합니다. 실측·용융온도가 아니며, 존 번호는 호퍼 쪽부터 다이 방향입니다. 참고 범위는 선택한 그레이드의 근거 또는 사용자 수정 범위입니다. 굵은 테두리는 범위 밖, 빗금은 미입력입니다.",
        "Colours show the zone set points entered under process conditions, not measured or melt temperatures; zones are numbered from the hopper toward the die. Reference bands come from the selected grade source or your edits; a heavy outline marks values outside the band and hatching marks missing values."
      ],
      "scale_labels": {
        "melt": [
          "배럴·다이",
          "Barrel & die"
        ],
        "tool": [
          "칠 롤",
          "Chill roll"
        ]
      },
      "zones": [
        {
          "key": "Z1",
          "field": "zone1",
          "label": [
            "존 1",
            "Zone 1"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -1.6088,
            -1.2812
          ],
          "r": 0.0615,
          "center": [
            1.55,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z2",
          "field": "zone2",
          "label": [
            "존 2",
            "Zone 2"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -1.1888,
            -0.8612
          ],
          "r": 0.0615,
          "center": [
            1.55,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z3",
          "field": "zone3",
          "label": [
            "존 3",
            "Zone 3"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.7688,
            -0.4412
          ],
          "r": 0.0615,
          "center": [
            1.55,
            0.0
          ],
          "parent": null
        },
        {
          "key": "die",
          "field": "die",
          "label": [
            "평다이",
            "Flat die"
          ],
          "group": "melt",
          "shape": "box",
          "parent": null,
          "min": [
            0.44927,
            1.3,
            -0.262
          ],
          "max": [
            0.58127,
            1.463,
            0.262
          ]
        },
        {
          "key": "chill",
          "field": "chillTop",
          "label": [
            "칠 롤",
            "Chill roll"
          ],
          "group": "tool",
          "shape": "roll_ends",
          "x": 0.55,
          "y": 0.99904,
          "r": 0.204,
          "z": [
            -0.3,
            0.3
          ],
          "width": 0.04
        }
      ]
    },
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
      "dancer": {
        "arm_mm": 240.0,
        "swing_deg": 6.0,
        "rise_mm": 25.09,
        "take_up_mm": 34.37
      },
      "turret": {
        "spindle_spacing_mm": 400.0,
        "index_deg": 180,
        "index_film_m": 1.0
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
      "air_knife_retract_mm": 50.0,
      "air_knife_cylinders": 2,
      "chill_wrap_deg": 180,
      "gauge": "traversing O-frame 700 mm",
      "edge_trim": true,
      "winder": "76 mm core to 500 mm on a two-spindle turret, with a dancer",
      "dancer": {
        "type": "pivot arm with the roll in a film loop, position sensor on the pivot shaft, rubber lower stops",
        "arm_mm": 240.0,
        "threading_to_working_deg": 6.0,
        "control": "the position sensor trims the winder speed to hold the working position",
        "grade": "C teaching values; not an OEM drawing"
      },
      "turret": {
        "type": "two spindles on two turret arms, index gear motor",
        "spindle_spacing_mm": 400.0,
        "index_deg": 180,
        "transfer": "cut and transfer to the new core not modelled",
        "grade": "C teaching values; not an OEM drawing"
      },
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
    "blender": "5.2.1 LTS",
    "groups": [
      "dancer",
      "flow",
      "gauge",
      "nip",
      "resin",
      "roll",
      "screw",
      "turret",
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
      2.43,
      0
    ],
    "span": [
      4.79,
      5.06
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
          "압출 시작 · 스크류 회전",
          "Start extruding · screw"
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
        "key": "nip",
        "label": [
          "닙롤 닫힘 · 공압 실린더",
          "Close the nip · pneumatic cylinders"
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
        "key": "air",
        "label": [
          "열풍 에어링 기동 · 60 °C",
          "Start the hot air ring · 60 °C"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          11.291666666666666
        ],
        "readout": {
          "from": 25,
          "to": 60,
          "unit": "°C",
          "digits": 1
        }
      },
      {
        "key": "inflate",
        "label": [
          "버블 팽창 · BUR 1→2",
          "Inflate the bubble · BUR 1 to 2"
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
        "key": "ibc",
        "label": [
          "IBC 기동 · 공급/배기",
          "Start the IBC · supply and exhaust"
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
          "닙롤 이송",
          "Draw with the nip rolls"
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
        "key": "winder",
        "label": [
          "권취 시작",
          "Start winding"
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
        "key": "oscillate",
        "label": [
          "오실레이팅 인취 · ±90° 반전",
          "Oscillating haul-off · ±90° reversing"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          11.291666666666666
        ]
      }
    ],
    "startup": {
      "intro": [
        "실제 라인의 기동 순서입니다. 스크류가 튜브를 환형 다이 밖으로 밀어내면 작업자가 케이지와 접힘 프레임을 지나 닙롤까지 끌어 올리고, 닙을 닫아 튜브 위쪽을 막고, 열풍 에어링을 60 °C로 올린 뒤 다이 중앙으로 공기를 넣어 버블을 BUR 2까지 부풀리고, IBC로 버블 안쪽 공기를 순환시키며 지름을 잡고, 닙롤로 접힌 필름을 권취기까지 보내 권취를 시작한 뒤 오실레이팅 인취를 돌립니다. 실제 라인은 존 온도가 설정값에 도달하고 균열(soak) 시간이 지나야 스크류가 기동되며(cold-start 보호), 모형은 그 이후부터 보여줍니다.",
        "The real start-up order: the screw pushes the tube out of the annular die, the operator pulls it up through the cage and collapsing frame to the nip rolls, the nip closes to seal the top of the tube, the hot air ring is brought to 60 °C, air through the die centre inflates the bubble to BUR 2, the IBC circulates the air inside the bubble and holds its diameter, the nip rolls draw the lay-flat film to the winder, where winding starts, and the oscillating haul-off starts reversing. A real line only lets the screw start once every zone has reached its set point and soaked (cold-start protection); the model starts after that."
      ],
      "steps": [
        {
          "key": "screw",
          "label": [
            "압출 시작 · 스크류 회전",
            "Start extruding · screw"
          ],
          "hint": [
            "스크류를 돌려 튜브를 환형 다이에서 케이지와 접힘 프레임을 지나 열린 닙롤까지 올리세요. 실제로는 작업자가 튜브 끝을 묶어 위로 끌어 올립니다.",
            "Turn the screw to push the tube from the annular die up through the cage and collapsing frame to the open nip rolls; on a real line the operator ties off the tube end and pulls it up."
          ],
          "needs": [],
          "locks": [],
          "once": true,
          "spin": {
            "screw": [
              29.2251,
              0
            ]
          },
          "thread": [
            0,
            2.5
          ]
        },
        {
          "key": "nip",
          "label": [
            "닙롤 닫힘 · 공압 실린더",
            "Close the nip · pneumatic cylinders"
          ],
          "hint": [
            "튜브가 닙롤 사이에 들어왔습니다. 공압 실린더로 오른쪽 닙롤을 밀어 닫으세요. 닫힌 닙이 튜브 위쪽을 막아야 버블에 공기를 넣을 수 있습니다.",
            "The tube is between the nip rolls. Close the right roll with the pneumatic cylinders; the closed nip seals the top of the tube so the bubble can hold air."
          ],
          "needs": [
            "screw"
          ],
          "locks": [],
          "once": false,
          "move": "nip"
        },
        {
          "key": "air",
          "label": [
            "열풍 에어링 기동 · 60 °C",
            "Start the hot air ring · 60 °C"
          ],
          "hint": [
            "블로어를 켜고 인라인 히터로 에어링 공기를 60 °C까지 올리세요. 히터는 블로어가 돌고 풍량 스위치가 풍량을 확인해야 켜지며, 과열 차단기가 따로 지킵니다. 목표는 프로스트 라인 위에서 수지(필름) 온도를 60 °C로 맞추는 것입니다. 반결정성 PHA(S1000P)는 60 °C에서 결정화가 빨라져 빨리 굳고, 굳은 필름은 닙과 권취 롤에서 서로 붙지(블로킹) 않습니다. 60 °C는 사내 실험·운전 경험·DSC 데이터에 근거한 사내 운전 기준입니다(사내 DSC: S1000P 4HB 3.3–5.3 %의 60 °C 반결정화 시간 7–28초). 공개 문헌도 P(3HB-co-4HB)가 약 60 °C에서 빠르게 결정화한다고 보고하며(CJ제일제당 공동 연구 등), P(3HB-co-4HB) 배합 필름에 에어링 공기 60 °C를 쓴 특허 실시예(CN118222074A)도 있습니다. 공기가 너무 차가우면 필름이 60 °C 아래로 빨리 식어 결정화가 느려질 수 있습니다. 비결정성 A1000P에는 해당하지 않습니다.",
            "Start the blower and let the inline heater bring the ring air to 60 °C. The heater can only switch on while the blower runs and the airflow switch confirms flow, and an independent high-limit guards it. The aim is a resin (film) temperature of 60 °C above the frost line. Semi-crystalline PHA (S1000P) crystallizes fast at 60 °C, so the film sets quickly and does not stick to itself (block) in the nip or on the winder. 60 °C is the in-house operating standard, based on in-house trials, line experience and DSC data (in-house DSC: 60 °C crystallization half-time of 7–28 s for S1000P with 3.3–5.3 % 4HB). Published work also finds that P(3HB-co-4HB) crystallizes fast at about 60 °C (including a study co-authored by CJ CheilJedang), and a patent example blew a P(3HB-co-4HB) compound film with 60 °C ring air (CN118222074A). Air that is too cold can cool the film below 60 °C quickly and slow its crystallization. It does not apply to amorphous A1000P."
          ],
          "needs": [
            "screw"
          ],
          "locks": [],
          "once": false,
          "spin": {
            "hotair": [
              3.4,
              0
            ]
          },
          "reveal": [
            "hotair"
          ],
          "readout": {
            "from": 25,
            "to": 60,
            "unit": "°C",
            "digits": 1
          }
        },
        {
          "key": "inflate",
          "label": [
            "버블 팽창 · BUR 1→2",
            "Inflate the bubble · BUR 1 to 2"
          ],
          "hint": [
            "닙이 튜브를 막았습니다. 다이 중앙으로 공기를 넣어 버블을 BUR 2(지름 160 mm, 레이플랫 251 mm)까지 부풀리세요. PHA의 BUR과 동결선 권장 범위는 정해져 있지 않습니다.",
            "The nip seals the tube. Blow air through the die centre to inflate the bubble to BUR 2 (160 mm bubble, 251 mm lay-flat); no PHA BUR or frost-line range is established."
          ],
          "needs": [
            "nip",
            "air"
          ],
          "locks": [],
          "once": false,
          "morph": "inflate"
        },
        {
          "key": "ibc",
          "label": [
            "IBC 기동 · 공급/배기",
            "Start the IBC · supply and exhaust"
          ],
          "hint": [
            "버블이 BUR 2로 섰습니다. IBC 공급·배기 블로어를 켜세요. 공급 공기는 다이 중앙의 스택 노즐에서 나와 필름 안쪽을 따라 올라가며 열을 빼앗고, 데워진 공기는 스택 위 흡입구로 빠집니다. 케이지의 초음파 센서 3개가 버블 지름을 재고, 제어기가 배기량을 맞춰 BUR 2를 유지합니다. IBC 공기 온도는 PHA 근거가 없어 정하지 않았습니다(비결정성 CA1240PF TDS는 냉각 공기를 권장).",
            "The bubble stands at BUR 2. Start the IBC supply and exhaust blowers: supply air leaves the nozzles of the stack in the die centre and sweeps up the inside of the film, taking heat away, and the warmed air is drawn into the stack top. Three ultrasonic sensors on the cage measure the bubble and the controller trims the exhaust to hold BUR 2. No IBC air temperature is set, for lack of a PHA source (the amorphous CA1240PF TDS recommends cooling air)."
          ],
          "needs": [
            "inflate"
          ],
          "locks": [],
          "once": false,
          "spin": {
            "ibc": [
              3.4,
              0
            ]
          },
          "reveal": [
            "ibc"
          ]
        },
        {
          "key": "haul",
          "label": [
            "닙롤 이송",
            "Draw with the nip rolls"
          ],
          "hint": [
            "IBC가 버블을 잡고 있습니다. 닙롤을 돌려 접힌 필름을 타워 위 가이드 롤을 지나 권취기까지 보내세요. 이송이 시작되면 모형은 닙, 에어링 온도, 버블 크기와 IBC를 고정합니다.",
            "The IBC holds the bubble. Run the nip rolls to draw the lay-flat film over the tower guide rolls to the winder; the model holds the nip, the air-ring temperature, the bubble size and the IBC once drawing starts."
          ],
          "needs": [
            "ibc"
          ],
          "locks": [
            "nip",
            "air",
            "inflate",
            "ibc"
          ],
          "once": true,
          "spin": {
            "haul": [
              22.2363,
              0
            ],
            "screw": [
              81.6637,
              0
            ]
          },
          "thread": [
            2.5,
            9.48575
          ]
        },
        {
          "key": "winder",
          "label": [
            "권취 시작",
            "Start winding"
          ],
          "hint": [
            "필름이 권취 코어에 닿았습니다. 권취기를 돌려 두 겹 레이플랫을 감으세요. 모형은 76 mm 코어에서 150 mm 권취 롤까지를 압축해 보여줍니다.",
            "The film has reached the winder core. Turn the winder to wind the two-ply lay-flat; the model compresses the growth from the 76 mm core to a 150 mm roll."
          ],
          "needs": [
            "haul"
          ],
          "locks": [],
          "once": true,
          "spin": {
            "winder": [
              5.6338,
              0
            ],
            "haul": [
              6.3662,
              0
            ],
            "screw": [
              23.3801,
              0
            ]
          },
          "wind": {
            "node": "Winder_body",
            "core": 0.5067
          }
        },
        {
          "key": "oscillate",
          "label": [
            "오실레이팅 인취 · ±90° 반전",
            "Oscillating haul-off · ±90° reversing"
          ],
          "hint": [
            "권취가 시작되었습니다. 오실레이팅 인취를 돌리세요. 닙롤, 실린더, 접힘 프레임을 실은 프레임이 데크의 선회 베어링 위에서 버블 축을 중심으로 좌우 90°씩(총 180°, 한 주기 120 s) 천천히 반전 회전하며, 버블 둘레의 두께 편차가 권취 롤 폭 전체로 퍼집니다. 슬라이더는 가운데 → +90° → −90°의 한 번 반전입니다. 실제 장치는 터닝 바로 필름 방향을 바로잡지만, 모형은 닙 위 약 1.1 m 자유 구간에서 필름이 완만하게 비틀리는 것으로 나타냅니다.",
            "Winding has started. Start the oscillating haul-off: the frame that carries the nip rolls, their cylinders and the collapsing frame turns on a slewing ring on the deck, reversing 90° each way about the bubble axis (180° total, 120 s per cycle), so the bubble’s circumferential gauge bands spread across the width of the wound roll. The slider runs one reversal: centre, +90°, then -90°. A real haul-off straightens the film with turning bars; the model shows it as a gentle twist of the film over a free span of about 1.1 m above the nip."
          ],
          "needs": [
            "winder"
          ],
          "locks": [],
          "once": false,
          "move": "oscillate"
        }
      ],
      "done": [
        "기동 완료 · \"자동 공정으로 돌아가기\"를 누르면 정상 운전(5 m/min)을 재생합니다.",
        "Start-up complete. Choose \"Return to cycle\" to play steady running at 5 m/min."
      ],
      "pinned": {
        "nip": 1,
        "oscillate": 0
      },
      "hidden": [
        "flow"
      ],
      "follow": {
        "resin": "screw"
      }
    },
    "views": [
      {
        "key": "all",
        "label": [
          "전체 라인",
          "Whole line"
        ],
        "center": [
          -0.044999999999999846,
          2.43,
          0
        ],
        "zoom": 1
      },
      {
        "key": "screw",
        "label": [
          "스크류·배럴 단면",
          "Screw & barrel cutaway"
        ],
        "center": [
          -0.6,
          1.0,
          0
        ],
        "zoom": 3.4,
        "position": [
          0.6,
          6.2,
          6.0
        ]
      },
      {
        "key": "die",
        "label": [
          "환형 다이·에어링·동결선",
          "Annular die, air ring & frost line"
        ],
        "center": [
          0.55,
          1.2,
          0
        ],
        "zoom": 5,
        "position": [
          2.05,
          4.2,
          6.0
        ]
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
        "zoom": 3.5,
        "position": [
          2.05,
          5.25,
          6.0
        ]
      }
    ],
    "heat": {
      "input": "process",
      "reference": "process",
      "title": [
        "배럴·다이 존 온도 (입력한 설정값)",
        "Barrel and die zone temperatures (entered set points)"
      ],
      "note": [
        "공정 조건에 입력한 존 설정값을 색으로 표시합니다. 실측·용융온도가 아니며, 존 번호는 호퍼 쪽부터 다이 방향입니다. 참고 범위는 선택한 그레이드의 근거 또는 사용자 수정 범위입니다. 굵은 테두리는 범위 밖, 빗금은 미입력입니다.",
        "Colours show the zone set points entered under process conditions, not measured or melt temperatures; zones are numbered from the hopper toward the die. Reference bands come from the selected grade source or your edits; a heavy outline marks values outside the band and hatching marks missing values."
      ],
      "scale_labels": {
        "melt": [
          "배럴·다이",
          "Barrel & die"
        ],
        "tool": [
          "에어링 공기",
          "Air-ring air"
        ]
      },
      "zones": [
        {
          "key": "Z1",
          "field": "zone1",
          "label": [
            "존 1",
            "Zone 1"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -1.1292,
            -0.9108
          ],
          "r": 0.056,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z2",
          "field": "zone2",
          "label": [
            "존 2",
            "Zone 2"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.8492,
            -0.6308
          ],
          "r": 0.056,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z3",
          "field": "zone3",
          "label": [
            "존 3",
            "Zone 3"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.5692,
            -0.3508
          ],
          "r": 0.056,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z4",
          "field": "zone4",
          "label": [
            "존 4",
            "Zone 4"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.2892,
            -0.0708
          ],
          "r": 0.056,
          "center": [
            1.0,
            0.0
          ],
          "parent": null
        },
        {
          "key": "die",
          "field": "die",
          "label": [
            "환형 다이",
            "Annular die"
          ],
          "group": "melt",
          "shape": "vband",
          "center": [
            0.55,
            0
          ],
          "y": [
            0.78,
            1.04
          ],
          "r": 0.125,
          "parent": null,
          "full": true
        },
        {
          "key": "air",
          "field": "airTemp",
          "label": [
            "에어링 공기",
            "Air-ring air"
          ],
          "group": "tool",
          "shape": "vband",
          "center": [
            0.55,
            0
          ],
          "y": [
            1.052,
            1.102
          ],
          "r": 0.128,
          "parent": null,
          "full": true
        }
      ]
    },
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
      "screw": 11,
      "hotair": 1,
      "ibc": 1
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
      "air_ring_air_c": 60,
      "oscillation": {
        "total_deg": 180,
        "period_s": 120,
        "twist_mm": [
          62.5,
          1200.0
        ],
        "twist_edge_strain_pct": 1.51
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
      "nip_threading_open_mm": 40.0,
      "nip_cylinders": 2,
      "hot_air_ring": {
        "train": [
          "inlet filter",
          "centrifugal blower (VFD)",
          "airflow (differential pressure) switch",
          "inline electric heater",
          "insulated manifold and four insulated hoses",
          "dual-lip air ring with plenum sensor",
          "PID controller (SCR)",
          "independent manual-reset high-limit"
        ],
        "air_setpoint_c": 60,
        "setpoint_basis": "In-house practice for semi-crystalline P(3HB-co-4HB) (S1000P), given by the user on 2026-10-17. Literature context: PHB overall crystallization half-time minimum about 30 s at 60-70 C (Macromolecules 59:379, 2026); PHBH crystallizes fastest when cooled to 50-70 C (US 10030117); spherulite growth peaks at 75-90 C for PHB/PHBV; no published value for 2-5 mol% 4HB.",
        "air_flow_m3_h": [
          150,
          300
        ],
        "heater_kw": 6,
        "heater_sizing": "P = Q rho cp dT (20 -> 60 C) plus 25-50 % losses",
        "high_limit_c": [
          80,
          90
        ],
        "interlocks": [
          "heater only with blower running and airflow switch made",
          "independent manual-reset high-limit",
          "blower run-on after the heater stops",
          "E-stop"
        ],
        "not_for": "amorphous A1000P (no crystallization; CJ film TDS CA1240PF uses chilled air and IBC)",
        "grade": "C teaching values; not an OEM drawing",
        "sources": "docs/research/pha-blown-film-hot-air-ring-20261017.md"
      },
      "oscillating_haul_off": {
        "type": "nip, carriage, cylinders and collapsing frame on a frame turning on a slewing ring (gear motor and pinion)",
        "total_deg": 180,
        "period_s": 120,
        "film_above_nip": "twists back to the fixed guide roll on the take-off frame over a free span 62.5-1200 mm above the nip, about 1.5 % edge strain at 90 deg, (theta W/2)^2 / (2 L^2); turning bars are not modelled",
        "grade": "C teaching values (Pack B); not an OEM drawing"
      },
      "ibc": {
        "train": [
          "supply blower",
          "die-centre supply channel",
          "stack with nozzle ring",
          "stack-top exhaust intake",
          "exhaust blower",
          "three ultrasonic bubble-diameter sensors on the cage",
          "IBC controller (trims the exhaust)"
        ],
        "stack_mm": {
          "od": 32.0,
          "height": 250.0,
          "nozzle_height": 50.0
        },
        "air_temperature": "not set (no PHA source); the amorphous CA1240PF TDS recommends cooling air for ring and IBC",
        "grade": "C teaching values (Pack B: optional, separate supply and exhaust); not an OEM drawing"
      },
      "winder": "76 mm core to 450 mm, two-ply lay-flat",
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
    "blender": "5.2.1 LTS",
    "groups": [
      "flow",
      "haul",
      "hotair",
      "ibc",
      "nip",
      "oscillate",
      "resin",
      "screw",
      "winder"
    ]
  },
  "blowmolding": {
    "id": "blowmolding",
    "duration": 12.0,
    "frames": [
      0,
      288
    ],
    "poster": "assets/equipment/blowmolding-motion-poster.png",
    "model": "assets/equipment/blowmolding-motion.glb",
    "center": [
      -0.3949999999999998,
      1.05,
      0
    ],
    "span": [
      4.1899999999999995,
      2.3
    ],
    "zoom": [
      0.7,
      14
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
          12.0
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
          12.0,
          11.5
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
          0.5,
          1.0
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
          1.0,
          1.5
        ]
      }
    ],
    "initial": {
      "parison": 0,
      "mold": 100,
      "pin": 0,
      "inflate": 0
    },
    "turns": {
      "screw": 12
    },
    "views": [
      {
        "key": "all",
        "label": [
          "전체 설비",
          "Whole machine"
        ],
        "center": [
          -0.3949999999999998,
          1.05,
          0
        ],
        "zoom": 1
      },
      {
        "key": "screw",
        "label": [
          "스크류·배럴 단면",
          "Screw & barrel cutaway"
        ],
        "center": [
          -0.6,
          1.5,
          0
        ],
        "zoom": 3.4,
        "position": [
          0.6,
          6.7,
          6.0
        ]
      },
      {
        "key": "finish",
        "label": [
          "금형·블로우 핀",
          "Mold & blow pin"
        ],
        "center": [
          0.35,
          1.215,
          0.15
        ],
        "zoom": 4.5,
        "position": [
          1.55,
          3.715,
          6.15
        ]
      },
      {
        "key": "head",
        "label": [
          "패리슨 헤드",
          "Parison head"
        ],
        "center": [
          0.35,
          1.34,
          0
        ],
        "zoom": 6,
        "position": [
          1.55,
          3.34,
          6.0
        ]
      }
    ],
    "heat": {
      "input": "process",
      "reference": "process",
      "title": [
        "배럴·다이 존 온도 (입력한 설정값)",
        "Barrel and die zone temperatures (entered set points)"
      ],
      "note": [
        "공정 조건에 입력한 존 설정값을 색으로 표시합니다. 실측·용융온도가 아니며, 존 번호는 호퍼 쪽부터 다이 방향입니다. 참고 범위는 선택한 그레이드의 근거 또는 사용자 수정 범위입니다. 굵은 테두리는 범위 밖, 빗금은 미입력입니다.",
        "Colours show the zone set points entered under process conditions, not measured or melt temperatures; zones are numbered from the hopper toward the die. Reference bands come from the selected grade source or your edits; a heavy outline marks values outside the band and hatching marks missing values."
      ],
      "scale_labels": {
        "melt": [
          "배럴·다이",
          "Barrel & die"
        ],
        "tool": [
          "금형",
          "Mould"
        ]
      },
      "zones": [
        {
          "key": "Z1",
          "field": "zone1",
          "label": [
            "존 1",
            "Zone 1"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -1.11893,
            -0.82773
          ],
          "r": 0.056,
          "center": [
            1.5,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z2",
          "field": "zone2",
          "label": [
            "존 2",
            "Zone 2"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.7456,
            -0.4544
          ],
          "r": 0.056,
          "center": [
            1.5,
            0.0
          ],
          "parent": null
        },
        {
          "key": "Z3",
          "field": "zone3",
          "label": [
            "존 3",
            "Zone 3"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.37227,
            -0.08107
          ],
          "r": 0.056,
          "center": [
            1.5,
            0.0
          ],
          "parent": null
        },
        {
          "key": "head",
          "field": "head",
          "label": [
            "패리슨 헤드",
            "Parison head"
          ],
          "group": "melt",
          "shape": "vband",
          "center": [
            0.35,
            0
          ],
          "y": [
            1.36,
            1.58
          ],
          "r": 0.104,
          "parent": null,
          "full": true
        },
        {
          "key": "die",
          "field": "die",
          "label": [
            "다이 부싱",
            "Die bushing"
          ],
          "group": "melt",
          "shape": "vband",
          "center": [
            0.35,
            0
          ],
          "y": [
            1.34,
            1.36
          ],
          "r": 0.036,
          "parent": null,
          "full": true
        },
        {
          "key": "mold_a",
          "field": "mold",
          "label": [
            "금형",
            "Mould"
          ],
          "group": "tool",
          "shape": "box",
          "parent": "MoldLeft",
          "min": [
            0.258,
            1.113,
            -0.113
          ],
          "max": [
            0.349,
            1.317,
            -0.0405
          ]
        },
        {
          "key": "mold_b",
          "field": "mold",
          "label": [
            "금형",
            "Mould"
          ],
          "group": "tool",
          "shape": "box",
          "parent": "MoldRight",
          "min": [
            0.351,
            1.113,
            -0.113
          ],
          "max": [
            0.442,
            1.317,
            -0.0405
          ]
        }
      ]
    },
    "lanes": [
      {
        "key": "head",
        "ko": "헤드·패리슨",
        "en": "Head & parison"
      },
      {
        "key": "clamp",
        "ko": "형체부",
        "en": "Clamp"
      },
      {
        "key": "shuttle",
        "ko": "셔틀",
        "en": "Shuttle"
      },
      {
        "key": "pin",
        "ko": "블로우 핀",
        "en": "Blow pin"
      },
      {
        "key": "takeout",
        "ko": "취출",
        "en": "Take-out"
      }
    ],
    "steps": [
      [
        0.0,
        0.4,
        "패리슨 절단",
        "Parison cut",
        "head"
      ],
      [
        0.4,
        12.0,
        "패리슨 연속 성장",
        "Parison grows continuously",
        "head"
      ],
      [
        0.0,
        7.0,
        "금형 닫힘 유지",
        "Mould closed",
        "clamp"
      ],
      [
        7.0,
        7.5,
        "형개",
        "Mould opening",
        "clamp"
      ],
      [
        7.5,
        11.5,
        "열림 대기",
        "Open, waiting",
        "clamp"
      ],
      [
        11.5,
        12.0,
        "금형 닫힘·포획",
        "Close & capture",
        "clamp"
      ],
      [
        0.0,
        0.5,
        "블로우 위치로 이동",
        "Shuttle to blow station",
        "shuttle"
      ],
      [
        8.2,
        9.0,
        "헤드 아래로 복귀",
        "Return under the head",
        "shuttle"
      ],
      [
        0.5,
        1.0,
        "핀 삽입",
        "Pin in",
        "pin"
      ],
      [
        1.0,
        1.5,
        "팽창",
        "Inflate",
        "pin"
      ],
      [
        1.5,
        6.5,
        "보압·냉각",
        "Hold & cool",
        "pin"
      ],
      [
        6.5,
        7.0,
        "배기",
        "Exhaust",
        "pin"
      ],
      [
        7.0,
        7.25,
        "핀 복귀",
        "Pin out",
        "pin"
      ],
      [
        7.5,
        8.2,
        "취출·컨베이어",
        "Take-out to conveyor",
        "takeout"
      ]
    ],
    "stages": [
      [
        "용융·헤드",
        "Melt & head"
      ],
      [
        "패리슨·금형 닫힘",
        "Parison & capture"
      ],
      [
        "금형·공기 팽창",
        "Mould & inflate"
      ],
      [
        "냉각·트리밍",
        "Cool & trim"
      ]
    ],
    "stage_segments": [
      [
        0.0,
        1.5,
        2
      ],
      [
        1.5,
        9.0,
        3
      ],
      [
        9.0,
        10.25,
        0
      ],
      [
        10.25,
        12.0,
        1
      ]
    ],
    "stage_starts": [
      9.3,
      11.0,
      1.25,
      7.8
    ],
    "blow": {
      "shuttle": {
        "head": 9.5,
        "station": 2.5
      },
      "release": {
        "from": [
          0.35,
          1.135,
          0.3
        ],
        "to": [
          0.35,
          0.818,
          0.56
        ]
      },
      "air": [
        1.0,
        7.0
      ],
      "bottle": [
        0.35,
        1.135,
        0.3
      ]
    },
    "timeline": {
      "cut_shuttle": [
        0.0,
        0.5
      ],
      "pin_in": [
        0.5,
        1.0
      ],
      "inflate": [
        1.0,
        1.5
      ],
      "hold_cool": [
        1.5,
        6.5
      ],
      "exhaust": [
        6.5,
        7.0
      ],
      "pin_out_open": [
        7.0,
        7.5
      ],
      "take_out": [
        7.5,
        8.2
      ],
      "return": [
        8.2,
        9.0
      ],
      "parison": [
        9.0,
        11.5
      ],
      "capture": [
        11.5,
        12.0
      ]
    },
    "timeline_offset_s": 3.0,
    "teaching": {
      "time_scale": 1,
      "cycle_s": 12.0,
      "parison_mm": {
        "od": 25.0,
        "length": 240.0
      },
      "mould_mm": "180 x 220 x 200",
      "opening_mm": 160.0,
      "shuttle_mm": 300.0,
      "pin_stroke_mm": 50.0,
      "knife_travel_mm": 80,
      "bottle_mm": {
        "height": 180.0,
        "body_d": 65.0,
        "neck_d": 28.0
      },
      "loop_note": "Pack B 12 s teaching timeline re-based at the parison cut (Pack B time = model time + 3 s)."
    },
    "spec": {
      "basis": "Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA blow-moulding setting",
      "screw_d_mm": 40,
      "l_d": 30,
      "extruder_axis_mm": 1500,
      "head_mm": "180 x 220",
      "outlet_mm": 25,
      "container": "180 mm tall, 65 mm body",
      "mould_mm": "180 x 220 x 200",
      "opening_mm": 160,
      "shuttle_mm": 300,
      "blow_pin_stroke_mm": 50,
      "knife_travel_mm": 80,
      "flash": "separate top and bottom flash on the bottle",
      "variants_not_shown": "dual shuttle (mirrored second clamp), accumulator head, rotary wheel",
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
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
      "screw",
      "shuttle"
    ]
  },
  "straw": {
    "id": "straw",
    "duration": 5.0,
    "frames": [
      0,
      120
    ],
    "poster": "assets/equipment/straw-motion-poster.png",
    "model": "assets/equipment/straw-motion.glb",
    "center": [
      2.715,
      0.95,
      0
    ],
    "span": [
      11.47,
      2.4
    ],
    "zoom": [
      0.7,
      18
    ],
    "controls": [
      {
        "key": "screw",
        "label": [
          "압출 시작 · 스크류 회전",
          "Start extruding · screw"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          5.0
        ]
      },
      {
        "key": "nip",
        "label": [
          "인취 벨트 닫힘 · 가압 실린더",
          "Close the belts · pressure cylinders"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          5.0
        ]
      },
      {
        "key": "haul",
        "label": [
          "인취 이송",
          "Haul-off draw"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          5.0
        ]
      },
      {
        "key": "cutter",
        "label": [
          "첫 절단 · 회전 커터",
          "First cut · rotary cutter"
        ],
        "max": 100,
        "unit": "%",
        "step": 0.1,
        "range": [
          0,
          5.0
        ]
      }
    ],
    "startup": {
      "intro": [
        "실제 라인의 기동 순서입니다. 스크류가 네 가닥의 튜브를 헤드 밖으로 밀어내면 작업자가 진공 사이징조와 냉각 수조를 지나 벨트 인취까지 끌어 넣고, 상부 벨트를 내려 물린 뒤 커터 너머로 보내 첫 절단을 합니다. 실제 라인은 존 온도가 설정값에 도달하고 균열(soak) 시간이 지나야 스크류가 기동되며(cold-start 보호), 모형은 그 이후부터 보여줍니다.",
        "The real start-up order: the screw pushes the four tubes out of the head, the operator leads them through the vacuum sizing tank and the cooling bath into the belt haul-off, the upper belts close on them and draw them past the cutter for the first cut. A real line only lets the screw start once every zone has reached its set point and soaked (cold-start protection); the model starts after that."
      ],
      "steps": [
        {
          "key": "screw",
          "label": [
            "압출 시작 · 스크류 회전",
            "Start extruding · screw"
          ],
          "hint": [
            "스크류를 돌려 네 가닥의 튜브를 헤드에서 진공 사이징조와 냉각 수조를 지나 벨트 인취 사이까지 보내세요. 실제로는 작업자가 손으로 끌어 넣고, 맨드렐 공기가 튜브 속을 열어 둡니다.",
            "Turn the screw to push the four tubes from the head through the vacuum sizing tank and the bath into the belt haul-off; on a real line the operator leads them by hand while mandrel air keeps the tubes open."
          ],
          "needs": [],
          "locks": [],
          "once": true,
          "spin": {
            "screw": [
              29.01,
              0
            ]
          },
          "thread": [
            0,
            5.802
          ]
        },
        {
          "key": "nip",
          "label": [
            "인취 벨트 닫힘 · 가압 실린더",
            "Close the belts · pressure cylinders"
          ],
          "hint": [
            "튜브가 벨트 사이에 들어왔습니다. 가압 실린더로 상부 벨트를 내려 네 가닥을 무세요.",
            "The tubes are between the belts. Lower the upper belts with the pressure cylinders to grip all four."
          ],
          "needs": [
            "screw"
          ],
          "locks": [],
          "once": false,
          "move": "nip"
        },
        {
          "key": "haul",
          "label": [
            "인취 이송",
            "Haul-off draw"
          ],
          "hint": [
            "벨트가 튜브를 물었습니다. 인취를 돌려 튜브를 회전 커터 너머 배출 트레이까지 보내세요. 인취가 시작되면 벨트를 열 수 없습니다.",
            "The belts grip the tubes. Run the haul-off to draw them past the rotary cutter onto the exit tray; the belts stay closed once hauling starts."
          ],
          "needs": [
            "nip"
          ],
          "locks": [
            "nip"
          ],
          "once": true,
          "spin": {
            "haul": [
              3.8595,
              0
            ],
            "screw": [
              4.85,
              0
            ]
          },
          "thread": [
            5.802,
            6.772
          ]
        },
        {
          "key": "cutter",
          "label": [
            "첫 절단 · 회전 커터",
            "First cut · rotary cutter"
          ],
          "hint": [
            "튜브가 트레이에 올라왔습니다. 커터를 한 바퀴 돌려 첫 절단을 하세요. 칼날이 아래를 지날 때 네 가닥이 함께 잘립니다.",
            "The tubes are on the tray. Turn the cutter once for the first cut; all four lanes are cut as the knife passes below."
          ],
          "needs": [
            "haul"
          ],
          "locks": [],
          "once": true,
          "spin": {
            "cutter": [
              1,
              0.5
            ],
            "haul": [
              0.7958,
              0
            ],
            "screw": [
              1.0,
              0
            ]
          },
          "release": {
            "node": "FirstStraws",
            "at": 0.5,
            "cut_s": 6.572,
            "path": [
              [
                7.05,
                1.0,
                0
              ],
              [
                7.35,
                1.0,
                0
              ],
              [
                7.8,
                0.66,
                0
              ]
            ]
          }
        }
      ],
      "done": [
        "기동 완료 · \"자동 공정으로 돌아가기\"를 누르면 정상 운전(12 m/min, 분당 240개)을 재생합니다.",
        "Start-up complete. Choose \"Return to cycle\" to play steady running at 12 m/min, 240 straws/min."
      ],
      "pinned": {
        "nip": 1
      },
      "hidden": [
        "flow"
      ],
      "follow": {
        "resin": "screw"
      }
    },
    "views": [
      {
        "key": "all",
        "label": [
          "전체 라인",
          "Whole line"
        ],
        "center": [
          2.715,
          0.95,
          0
        ],
        "zoom": 1
      },
      {
        "key": "screw",
        "label": [
          "스크류·배럴 단면",
          "Screw & barrel cutaway"
        ],
        "center": [
          -0.9,
          1.0,
          0
        ],
        "zoom": 3.0,
        "position": [
          0.3,
          6.2,
          6.0
        ]
      },
      {
        "key": "head",
        "label": [
          "튜브 헤드·진공 사이징",
          "Tube head & vacuum sizing"
        ],
        "center": [
          0.62,
          1.0,
          0
        ],
        "zoom": 6,
        "position": [
          1.62,
          3.4,
          5.0
        ]
      },
      {
        "key": "bath",
        "label": [
          "냉각 수조·가이드 풀리",
          "Cooling bath & guide pulleys"
        ],
        "center": [
          3.45,
          1.0,
          0
        ],
        "zoom": 2.4,
        "position": [
          4.95,
          4.0,
          6.0
        ]
      },
      {
        "key": "finish",
        "label": [
          "벨트 인취·회전 커터",
          "Belt haul-off & rotary cutter"
        ],
        "center": [
          6.62,
          1.0,
          0
        ],
        "zoom": 6,
        "position": [
          7.62,
          3.2,
          5.0
        ]
      }
    ],
    "heat": {
      "input": "panel",
      "reference": {
        "grade": "CB0400A"
      },
      "title": [
        "스트로 라인 설정 온도 (여기서 입력) · CB0400A 자료 대비",
        "Straw line set points (enter here) · against the CB0400A source"
      ],
      "note": [
        "스트로 탭에는 공정 입력 양식이 없어 여기에 입력한 설정값을 색으로 표시합니다. 이 브라우저에만 저장되며 실측 온도가 아닙니다. 참고 범위는 CJ PHACT CB0400A 자료의 단계별 배럴 온도, 다이와 수조 온도이며 다른 그레이드에는 맞지 않을 수 있습니다. 존 번호는 호퍼 쪽부터이니 실제 설비의 존 배치와 맞춰 입력하세요. 굵은 테두리는 범위 밖, 빗금은 미입력입니다.",
        "The straw tab has no process form, so set points typed here are shown in colour. They stay in this browser and are not measured temperatures. Reference bands are the CJ PHACT CB0400A source stage barrel temperatures, die and bath temperatures and may not suit other grades. Zones are numbered from the hopper; match them to the machine. A heavy outline marks values outside the band and hatching marks missing values."
      ],
      "scale_labels": {
        "melt": [
          "배럴·헤드",
          "Barrel & head"
        ],
        "tool": [
          "공급부·수조",
          "Feed throat & baths"
        ]
      },
      "zones": [
        {
          "key": "feed",
          "field": "feed",
          "label": [
            "공급부 (수냉)",
            "Feed throat (water-cooled)"
          ],
          "group": "tool",
          "shape": "box",
          "parent": null,
          "min": [
            -1.8,
            0.937,
            -0.064
          ],
          "max": [
            -1.65,
            1.063,
            0.064
          ],
          "ref": [
            "stages",
            0
          ]
        },
        {
          "key": "Z1",
          "field": "zone1",
          "label": [
            "존 1 · 고체 이송",
            "Zone 1 · solid conveying"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -1.54317,
            -1.14017
          ],
          "r": 0.067,
          "center": [
            1.0,
            0.0
          ],
          "parent": null,
          "ref": [
            "stages",
            1
          ]
        },
        {
          "key": "Z2",
          "field": "zone2",
          "label": [
            "존 2 · 압축·용융",
            "Zone 2 · compression/melting"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -1.0265,
            -0.6235
          ],
          "r": 0.067,
          "center": [
            1.0,
            0.0
          ],
          "parent": null,
          "ref": [
            "stages",
            2
          ]
        },
        {
          "key": "Z3",
          "field": "zone3",
          "label": [
            "존 3 · 계량",
            "Zone 3 · metering"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            -0.50983,
            -0.10683
          ],
          "r": 0.067,
          "center": [
            1.0,
            0.0
          ],
          "parent": null,
          "ref": [
            "stages",
            3
          ]
        },
        {
          "key": "die",
          "field": "die",
          "label": [
            "튜브 헤드",
            "Tube head"
          ],
          "group": "melt",
          "shape": "half_band",
          "x": [
            0.155,
            0.345
          ],
          "r": 0.089,
          "center": [
            1.0,
            0.0
          ],
          "parent": null,
          "full": true,
          "ref": [
            "straw",
            "die"
          ]
        },
        {
          "key": "vacuum_water",
          "field": "bath",
          "label": [
            "수조 물 (진공·냉각)",
            "Bath water (vacuum & cooling)"
          ],
          "group": "tool",
          "shape": "box",
          "parent": null,
          "min": [
            0.51,
            0.883,
            -0.148
          ],
          "max": [
            1.29,
            1.03,
            -0.08
          ],
          "ref": [
            "straw",
            "waterBath"
          ]
        },
        {
          "key": "bath_water",
          "field": "bath",
          "label": [
            "수조 물 (진공·냉각)",
            "Bath water (vacuum & cooling)"
          ],
          "group": "tool",
          "shape": "box",
          "parent": null,
          "min": [
            1.46,
            0.913,
            -0.148
          ],
          "max": [
            5.44,
            1.03,
            -0.08
          ],
          "ref": [
            "straw",
            "waterBath"
          ]
        }
      ]
    },
    "stages": [
      [
        "공급·용융",
        "Feed & melt"
      ],
      [
        "튜브 헤드·진공 사이징",
        "Tube head & vacuum sizing"
      ],
      [
        "수조 냉각·인취",
        "Bath cooling & haul-off"
      ],
      [
        "회전 절단·배출",
        "Rotary cut & discharge"
      ]
    ],
    "turns": {
      "screw": 5,
      "haul": 4,
      "cutter": 5
    },
    "cut_edges": 1,
    "study": {
      "rpm": 60.0,
      "speed": 12.0,
      "diameter": 80.0,
      "pitch": 200.0
    },
    "teaching": {
      "time_scale": 1,
      "rpm": {
        "screw": 60.0,
        "haul": 47.746,
        "guide": 95.493,
        "cutter": 60.0
      },
      "line_speed_m_min": 12.0,
      "cut_length_mm": 200.0,
      "pulley_mm": 80.0,
      "guide_pulley_mm": 40.0,
      "knife_mm": 120.0,
      "lanes": 4,
      "lane_pitch_mm": 40,
      "straw_mm": {
        "od": 6.0,
        "wall": 0.2500000000000002,
        "length": 200.0
      },
      "straws_per_min": {
        "lane": 60.0,
        "line": 240.0
      },
      "loop_note": "Real time: five cuts per 5 s loop; drums and pulleys turn a whole number of times per loop (within 0.6 %)."
    },
    "spec": {
      "basis": "Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA setting",
      "screw_d_mm": 50,
      "l_d": 33,
      "heating_zones": 3,
      "shaft_height_mm": 1000,
      "tube_head_mm": {
        "d": 150,
        "length": 200
      },
      "vacuum_sizing_mm": 800,
      "bath_mm": [
        4000,
        300,
        120
      ],
      "guide_pulleys": 3,
      "haul_off": {
        "contact_mm": 400,
        "belt_width_mm": 80,
        "pairs": 2,
        "threading_lift_mm": 40.0,
        "pressure_cylinders": 2
      },
      "cutter": {
        "d_mm": 120.0,
        "knives": 1
      },
      "previous_rig": "Straw Optimizer v2 snapshot (assets/equipment/sources/straw-optimizer-v2.blend), replaced by this real-scale rig",
      "sources": "output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md"
    },
    "blender": "5.2.1 LTS",
    "groups": [
      "cutter",
      "flow",
      "haul",
      "nip",
      "resin",
      "screw"
    ]
  }
};
