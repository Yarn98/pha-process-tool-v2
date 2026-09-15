/* Source-reviewed conditional guidance. See docs/research/flash-control-evidence-20260915.md. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) root.PHAFlashGuideData = data;
})(typeof window !== 'undefined' ? window : null, function () {
  return {
    version: 'pha-flash-guide-20260915-v1',
    reviewed: '2026-09-15',
    sources: {
      basf: {
        title: 'BASF — Injection-Molding Problems, §09 Flash',
        url: 'https://download.basf.com/p1/8a8082587fd4b608017fd6631d5a24b1/en/Injection-Molding_Problems_in_Engineering_Thermoplastics_-_Causes_and_Solutions_Brochure_English.pdf#page=28',
        scope: {
          ko: '일반 사출의 틈새·손상·변형과 서로 다른 온도 조치 분기입니다. 특정 PHA의 온도나 압력을 정하지 않습니다.',
          en: 'General molding guidance on gaps, damage, deformation and different temperature branches. It does not establish PHA setpoints.'
        }
      },
      moldmasters: {
        title: 'Mold-Masters — FSG2 User Manual, §12.5.8 Flash',
        url: 'https://www.moldmasters.com/sites/default/files/2022-07/ENG%20FSG2%20UM_0.pdf',
        scope: {
          ko: '지지·금형 손상·형체력·벤트·전환·보압 점검입니다. 공식 PDF 색인의 해당 절을 확인했으며 전체 파일 직접 열기는 실패했습니다.',
          en: 'Checks for support, tool damage, clamp, vents, transfer and packing. The relevant official PDF excerpt was verified; direct access to the full file failed.'
        }
      },
      valveGate: {
        title: 'Mold-Masters — Sequential Valve Gate Control',
        url: 'https://www.moldmasters.com/index.php/products/controllers/svg',
        scope: {
          ko: '밸브 게이트의 개폐 순서·시점 제어를 설명합니다. 열 게이트의 고화 시험과 기계적 닫힘을 같은 것으로 취급하지 않습니다.',
          en: 'Describes valve-gate sequence and timing control. Mechanical closure is distinct from thermal gate freeze.'
        }
      },
      rjgFlash: {
        title: 'RJG — The Two Causes of Flash',
        url: 'https://rjginc.com/the-two-causes-of-flash/',
        scope: {
          ko: '금형 접촉과 충전만 비교하는 진단의 일반 근거입니다. 원문의 특정 충전율을 공통 목표로 사용하지 않습니다.',
          en: 'General evidence for mold-contact checks and fill-only diagnosis. Its particular fill percentage is not a universal target.'
        }
      },
      rjgFill: {
        title: 'RJG — Establishing a Fill-Only Part',
        url: 'https://rjginc.com/establishing-a-fill-only-part-sometimes-easier-said-than-done/',
        scope: {
          ko: '중량 비율과 체적 충전율의 차이, 박육·다수 캐비티의 예외를 설명합니다. 모든 형상에 같은 전환 위치를 적용하지 않습니다.',
          en: 'Explains mass versus volume fill and thin-wall/multi-cavity exceptions. It does not support one transfer point for every part.'
        }
      },
      rjgCushion: {
        title: 'RJG — Set Screw Bottom to Get Cushion',
        url: 'https://rjginc.com/tip/set-screw-bottom-to-get-cushion/',
        scope: {
          ko: '스크류가 가장 전진한 위치와 전진 한계 사이의 쿠션 정의·측정 기준입니다. 여기서 장비 영점 조작이나 쿠션 목표를 지시하지 않습니다.',
          en: 'Defines cushion relative to the furthest-forward screw position and screw bottom. This guide prescribes neither machine-zero operations nor a cushion target.'
        }
      },
      arburg: {
        title: 'ARBURG — Filling multi-cavity moulds (2024)',
        url: 'https://www.arburg.com/en/gb/company/news-press-releases/detail/filling-multi-cavity-moulds/',
        scope: {
          ko: 'V/P 전환의 압력 피크·하강이 버와 충전 균형에 영향을 주는 근거입니다. 특정 제어 기능의 성능을 이 앱이 보장하지 않습니다.',
          en: 'Shows how transfer pressure peaks/drops affect flash and fill balance. This app does not provide or guarantee the cited machine-control performance.'
        }
      },
      engel: {
        title: 'ENGEL — Clamping Force Calculation and Optimization',
        url: 'https://www.engelglobal.com/en/ca/digital-solutions/injection-mold-sampling/clamping-force-calculation',
        scope: {
          ko: '형체력 부족과 과도의 상충, 배기·금형 부하를 확인하는 일반 근거입니다. 높은 형체력이 항상 유리하다는 뜻은 아닙니다.',
          en: 'General evidence for insufficient/excessive clamp tradeoffs, venting and mold load. More clamp force is not always better.'
        }
      },
      misumi: {
        title: 'MISUMI — Ejector sleeve and center-pin combinations',
        url: 'https://us.misumi-ec.com/maker/misumi/mold/select/ejeslb.html',
        scope: {
          ko: '끼워맞춤 간극의 버 발생·미끄럼 특성 상충을 설명합니다. 부품 카탈로그 치수는 PHA 공통 간극이 아닙니다.',
          en: 'Explains the clearance tradeoff between burr formation and sliding. Catalog dimensions are not universal PHA clearances.'
        }
      },
      cb0104a: {
        title: 'CJ Biomaterials — PHACT CB0104A (June 2026), p.2',
        url: 'https://cjbiomaterials.com/wp-content/uploads/2025/03/TDS-CB0104A.pdf#page=2',
        scope: {
          ko: 'CB0104A 전용 속도·플래시, 수분·점도 저하와 고온 체류 안내입니다. 다른 PHA나 사용자 배합으로 그대로 옮기지 않습니다.',
          en: 'CB0104A-specific guidance on speed/flash, moisture/viscosity loss and hot residence. Do not transfer it unchanged to other PHA grades or blends.'
        }
      },
      ca1180p: {
        title: 'CJ Biomaterials — PHACT CA1180P (03/2023)',
        url: 'https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1180P.pdf',
        scope: {
          ko: 'PLA+aPHA 컴파운드의 일반/고내열 금형 모드와 장비 상대 속도 % 자료입니다. 건조 본문과 표의 제한도 함께 확인합니다.',
          en: 'PLA+aPHA compound guidance with general/high-heat mold modes and machine-relative speed %. Check the drying text as well as the table.'
        }
      },
      autodeskClamp: {
        title: 'Autodesk — Modeling for accurate clamp-force prediction',
        url: 'https://help.autodesk.com/cloudhelp/2019/ENU/MoldflowInsight-Modelprep/files/GUID-5C97629F-C5C5-4A6D-BD2A-55FE6A4A5EE2.htm',
        scope: {
          ko: '투영면적별 압력 적분과 충전·보압의 최대 힘, 중복 투영 한계입니다. 단순 계산은 금형 강성·기계 상태 검증을 대신하지 않습니다.',
          en: 'Pressure integration over projected area, peak force during fill/pack and overlapping-projection limits. A simple calculation cannot validate mold stiffness or machine condition.'
        }
      },
      autodeskPack: {
        title: 'Autodesk — Packing profiles',
        url: 'https://help.autodesk.com/cloudhelp/2016/ENU/MoldflowComm/files/GUID-927CDD74-5892-4FA5-85D3-E0354F8A5654.htm',
        scope: {
          ko: '보압 전달·시간별 중량·게이트 고화와 수축을 설명합니다. 예시 보압비·시간은 PHA 설정값으로 채택하지 않습니다.',
          en: 'Explains packing transmission, weight versus hold time, gate freeze and shrinkage. Example pressure ratios and times are not adopted as PHA settings.'
        }
      }
    },
    routes: [
      {
        id: 'inspect',
        title: { ko: '먼저 발생 단계를 나눠요', en: 'First separate the process stages' },
        when: { ko: '버가 충전 중인지 보압 중인지 모르거나 원인이 섞여 보일 때입니다.', en: 'Use this when the onset is unknown or several causes may be involved.' },
        check: { ko: '버의 위치와 캐비티(제품이 만들어지는 금형 공간) 번호를 표시합니다. 충전 형상, 쿠션(스크류의 전진 한계까지 남은 거리)과 압력 기록을 확인하고 핀 자국·취출 찢김과 구분합니다.', en: 'Mark the flash location and cavity number. Check fill shape, cushion and pressure records; distinguish flash from pin marks or ejection tears.' },
        action: { ko: '승인된 시험·취출 절차에서 충전만 한 제품과 보압 후 제품을 비교합니다. 기계 보호 기능은 유지합니다.', en: 'Under the approved trial/ejection procedure, compare fill-only parts with packed parts. Keep machine protection functions active.' },
        verify: { ko: '각 캐비티의 버·충전 상태·중량을 비교합니다. 식은 제품의 중량 비율을, 전환 순간에 캐비티가 얼마나 찼었는지로 그대로 읽지 않습니다.', en: 'Compare flash, fill and mass for each cavity. The mass percentage of a cooled part does not show how full the cavity was at the moment of transfer.' },
        stop: { ko: '금형 손상·끼인 제품·불안정한 취출이 보이면 시험을 멈추고 정비로 연결합니다.', en: 'Stop the trial for suspected tool damage, a trapped part or unstable ejection; refer to maintenance.' },
        sources: ['rjgFlash', 'rjgFill', 'rjgCushion']
      },
      {
        id: 'fill',
        title: { ko: '충전 말기·전환을 확인해요', en: 'Check late filling and transfer' },
        when: { ko: '충전만 한 제품에도 버가 있거나, 충전 말기나 V/P 전환(속도 제어에서 압력 제어로 바꾸는 시점)에서 압력이 급히 오를 때입니다.', en: 'Use this if flash is present on fill-only parts, or pressure spikes near the end of fill or at V/P transfer (the switch from speed control to pressure control).' },
        check: { ko: '금형 틈새와 충전 불균형을 먼저 봅니다. 샷량·실제 V/P 위치·말기 속도·압력 응답·쿠션을 함께 확인합니다.', en: 'First check tool gaps and fill imbalance. Review shot size, actual transfer position, late-stage speed, pressure response and cushion together.' },
        action: { ko: '전환이 늦으면 앞당기는 비교, 말기 압력이 급등하면 말기 감속을 허용 범위에서 한 항목씩 비교합니다.', en: 'For confirmed late transfer, test earlier transfer; for an end-of-fill surge, test lower late-stage speed. Change one item at a time within permitted limits.' },
        verify: { ko: '버가 줄면서 모든 캐비티의 충전·중량·표면이 유지되어야 합니다. 평균 중량만 보지 않습니다.', en: 'Flash must decrease while fill, mass and surface quality remain acceptable in every cavity. Do not rely on mean mass alone.' },
        stop: { ko: '조기 전환으로 흐름 끝이 굳거나 미충전(쇼트)·가스 탄 자국이 늘면 이전 조건으로 복귀합니다. 같은 자리에 버가 계속되면 금형 접촉면 정비를 확인합니다.', en: 'Revert if earlier transfer freezes the flow front or increases short shots (incomplete parts) or burn marks. Persistent flash at the same spot calls for a tool-contact check.' },
        sources: ['basf', 'rjgFill', 'arburg']
      },
      {
        id: 'pack',
        title: { ko: '보압·게이트 씰을 확인해요', en: 'Check packing and gate seal' },
        when: { ko: '충전만 한 제품에는 없던 버가, 보압까지 적용한 제품에서 보일 때입니다.', en: 'Use this when flash appears on packed parts but not on the fill-only comparison parts.' },
        check: { ko: '전환 전 과충전, 전환 시 압력 응답과 보압 전달(보압이 캐비티 안까지 미치는지)을 확인합니다. 열 게이트의 고화(수지가 굳어 막힘)와 밸브 게이트의 기계적 닫힘은 구분합니다.', en: 'Check overfilling before transfer, the transfer pressure response and packing transmission. Distinguish thermal gate freeze from valve-gate closure.' },
        action: { ko: '과도한 보압이 확인되면 보압을 낮추는 비교부터 진행합니다. 보압 시간은 게이트의 고화나 밸브 닫힘 방식, 중량·치수 결과를 함께 보며 정합니다. P1/P2(두 보압 구간의 압력) 비율을 일률적으로 정하지 않습니다.', en: 'For confirmed excessive packing, start by testing lower packing pressure. Review time against the required gate seal rather than prescribing a fixed P1/P2 ratio.' },
        verify: { ko: '보압 시간에 따른 중량 안정화와 함께 캐비티별 버·치수·싱크(표면 꺼짐)·공극(제품 내부의 빈 공간)을 확인합니다.', en: 'Check mass stabilization versus hold time together with cavity-specific flash, dimensions, sink marks (surface depressions) and internal voids (empty spaces inside the part).' },
        stop: { ko: '버를 줄이는 동안 중량·치수가 벗어나거나 싱크·공극이 늘면 복귀합니다. 필요하면 전환·게이트·균형을 다시 봅니다.', en: 'Revert if reduced flash comes with unacceptable mass/dimensions or more sinks/voids. Revisit transfer, gates and balance as needed.' },
        sources: ['moldmasters', 'rjgFlash', 'arburg', 'autodeskPack', 'valveGate']
      },
      {
        id: 'parting',
        title: { ko: '파팅 면·지지를 확인해요', en: 'Check the parting surface and support' },
        when: { ko: '같은 금형 경계에 반복되거나 금형이 국부적으로 벌어지는 듯할 때입니다.', en: 'Use this for repeated flash at one mold interface or suspected local mold opening.' },
        check: { ko: '이물·마모·손상·접촉 상태, 금형 지지·정렬과 실제 형체력(금형을 닫아 누르는 힘)을 확인합니다. 분해 점검은 설비 정지·격리 후 진행합니다.', en: 'Check contamination, wear, damage, contact, mold support/alignment and actual clamp force. Stop and isolate before dismantling.' },
        action: { ko: '확인된 접촉·손상 문제를 복구합니다. 형체력 부족은 금형·설비 한도 안에서 검증하며 계산값을 기계 설정으로 바로 쓰지 않습니다.', en: 'Restore the identified contact or damage problem. Verify inadequate clamp only within mold/machine limits; do not apply a calculated force directly as a setting.' },
        verify: { ko: '버·금형 미세 벌어짐과 함께 배기, 가스 탄 자국·금형 부하를 확인합니다. 최대 톤수가 목표는 아닙니다.', en: 'Check flash and slight mold opening (mold breathing) together with venting, burn marks and tool load. Maximum tonnage is not the goal.' },
        stop: { ko: '손상·변형이 의심되거나 허용 형체력에 접근하면 조건 증대 대신 정비·설비 적합성 검토로 전환합니다.', en: 'For suspected damage/deformation or approach to clamp limits, move to maintenance and machine/tool suitability review rather than adding force.' },
        sources: ['basf', 'moldmasters', 'engel', 'autodeskClamp']
      },
      {
        id: 'vent',
        title: { ko: '배기 홈의 누출·막힘을 확인해요', en: 'Check vent leakage and blockage' },
        when: { ko: '얇은 수지 날개가 금형의 배기 홈 위치와 일치할 때입니다.', en: 'Use this when a thin fin of plastic aligns with a mold vent.' },
        check: { ko: '벤트 랜드(배기 홈이 얕고 평평하게 이어지는 구간)·깊이·마모·오염과 수리 이력을 원래 승인된 형상과 비교합니다. 흐름 끝의 미충전(쇼트)·탄 자국도 함께 봅니다.', en: 'Compare the vent land (the shallow flat section of the vent) and its depth, wear, contamination and repair history with the approved geometry. Also check end-of-fill short shots and burn marks.' },
        action: { ko: '금형 담당자가 확인된 막힘·형상 이상을 복구합니다. 배기 홈을 무조건 깊게 파거나 막지 않으며 PHA 공통 깊이를 적용하지 않습니다.', en: 'Have tooling personnel restore confirmed blockage or geometry faults. Do not blindly deepen or close vents, or apply a universal PHA vent depth.' },
        verify: { ko: '버가 줄고 가스가 배출되어야 합니다. 충전·기포·탄 자국이 나빠지면 배기 기능 저하 가능성을 확인합니다.', en: 'Flash must decrease while gas can still escape. If filling, voids or burns worsen, check for reduced venting performance.' },
        stop: { ko: '수지가 계속 새거나 막힌 가스 때문에 결함이 늘면 추가 가공·조건 변경을 멈추고 설계를 재검토합니다.', en: 'Stop further tooling/process changes if leakage persists or trapped-gas defects increase; review the vent design.' },
        sources: ['moldmasters', 'engel']
      },
      {
        id: 'ejector',
        title: { ko: '이젝터 주변 간극을 확인해요', en: 'Check the ejector interface' },
        when: { ko: '이젝터 핀 둘레에 얇은 고리·날개가 붙어 있을 때입니다.', en: 'Use this for a thin ring or fin around an ejector pin.' },
        check: { ko: '눌림 자국과 실제 버를 구분합니다. 정지·격리 후 핀·슬리브·홀의 마모·끼워맞춤·정렬을 확인합니다.', en: 'Distinguish a pressure mark from excess plastic. After stopping and isolating, inspect pin/sleeve/bore wear, fit and alignment.' },
        action: { ko: '금형 담당자가 간극과 미끄럼 작동을 함께 복구합니다. 클램프 증가나 임의 간극 축소로 해결을 대신하지 않습니다.', en: 'Have tooling personnel restore fit and sliding function together. Extra clamp or arbitrary clearance reduction is not a substitute.' },
        verify: { ko: '고리 버가 줄고 핀이 원활히 움직이며 제품의 취출 자국·손상이 늘지 않아야 합니다.', en: 'The ring must decrease while the pin moves freely and ejection marks or part damage do not increase.' },
        stop: { ko: '핀이 끼거나 취출·복귀가 불안정하면 운전을 멈추고 정비합니다.', en: 'Stop and service the mold if the pin binds or ejection/return becomes unstable.' },
        sources: ['misumi']
      },
      {
        id: 'heat',
        title: { ko: '과열·긴 체류로 점도가 낮아졌나요?', en: 'Has heat or residence reduced viscosity?' },
        when: { ko: '가열·대기 후 버가 늘거나 실제 수지온도·MI(용융지수: 정해진 시험 조건에서 수지가 얼마나 흐르는지 보는 값) 변화가 함께 보일 때 확인할 가설입니다.', en: 'Consider this hypothesis if flash grows after heating/idle time or accompanies changes in actual melt temperature or MI (melt flow index, measured under defined test conditions).' },
        check: { ko: '실제 용융온도, 배럴·핫러너 체류와 재료·수분을 확인합니다. MI는 같은 배합·건조·시험 온도·하중·예열시간으로 비교합니다.', en: 'Check actual melt temperature, barrel/hot-runner residence, material and moisture. Compare MI at matching formulation, drying, test temperature, load and preheat time.' },
        action: { ko: '확인된 과열에는 실제 수지온도 저감, 긴 체류에는 불필요한 대기 축소, 수분에는 해당 건조·보관 복구를 검토합니다. 그레이드 범위에서 원인별로 조정합니다.', en: 'For confirmed overheating, lower actual melt temperature; for long residence, reduce unnecessary idle time; for moisture, restore specified drying/storage. Match each change to the cause and grade limits.' },
        verify: { ko: '버·충전과 MI·색상·취성·제품 물성을 함께 봅니다. MI만으로 분해를 확정하거나 냉각만으로 손상이 회복됐다고 보지 않습니다.', en: 'Check flash/fill with MI, color, brittleness and product properties. MI alone does not prove degradation, and cooling does not undo damage.' },
        stop: { ko: '미충전이 늘거나 변색·가스·물성 저하가 계속되면 조건 시험을 중단하고 재료·열 이력을 다시 확인합니다.', en: 'Stop the trial if underfilling grows or discoloration, gas or property loss persists; reassess material and thermal history.' },
        sources: ['basf', 'cb0104a']
      },
      {
        id: 'resistance',
        title: { ko: '차갑거나 막혀 충전 저항이 큰가요?', en: 'Is cold or restricted flow raising resistance?' },
        when: { ko: '충전 저항·압력 제한·말단 쇼트가 보이면서 일부에 버도 생길 때 확인할 가설입니다.', en: 'Consider this hypothesis when filling resistance, pressure limiting or end-of-fill shorts coexist with flash elsewhere.' },
        check: { ko: '실제 온도와 히터·온조기, 러너(수지가 지나가는 금형 통로)·게이트의 막힘, 배기, 캐비티 균형을 확인합니다. 금형 틈새 손상 문제와 과열로 점도가 낮아진 문제를 먼저 구분합니다.', en: 'Check actual temperatures, heaters/temperature control, runner/gate restrictions, venting and cavity balance. Distinguish tool gaps and overheated low viscosity first.' },
        action: { ko: '막힘·열 불균형을 먼저 복구합니다. 낮은 온도로 용융·유동이 부족한 경우에만 그레이드 범위에서 필요한 구간의 승온 또는 충전 방식 변경을 한 항목씩 비교합니다.', en: 'First restore blockage or thermal imbalance. Only for confirmed inadequate melting/flow from low temperature, test added heat in the needed zone or a filling change, one at a time within grade limits.' },
        verify: { ko: '필요한 충전이 좋아지면서 버·압력·수지온도·MI와 모든 캐비티의 품질이 허용 범위에 있어야 합니다.', en: 'Required filling must improve while flash, pressure, melt temperature, MI and quality in every cavity remain acceptable.' },
        stop: { ko: '승온으로 버·변색·MI 또는 물성이 악화되면 복귀합니다. 더 높은 압력으로 금형 틈새나 불균형을 덮지 않습니다.', en: 'Revert if added heat worsens flash, discoloration, MI or properties. Do not mask tool gaps or imbalance with higher pressure.' },
        sources: ['basf', 'rjgFill', 'arburg']
      }
    ],
    gradeNotes: [
      {
        title: { ko: 'CB0104A를 사용할 때', en: 'When using CB0104A' },
        text: { ko: 'June 2026 TDS는 압력 급등·플래시를 줄이도록 사출속도 최소화를 권고합니다. 필요한 충전·품질을 유지하는 범위에서 확인하며, 다른 PHA의 공통 속도나 mm/s 값으로 옮기지 않습니다.', en: 'The June 2026 TDS recommends minimizing injection speed to limit pressure surges and flash. Validate while preserving fill and quality; do not convert this into a universal PHA speed or mm/s value.' },
        sources: ['cb0104a']
      },
      {
        title: { ko: 'CA1180P는 금형 모드도 구분해요', en: 'CA1180P has distinct mold modes' },
        text: { ko: 'CA1180P는 PLA+aPHA 컴파운드입니다. 일반/고내열 금형 조건과 건조 본문을 구분하고 속도 %는 실제 장비에 맞춰 확인합니다. CB0104A 조건을 그대로 쓰지 않습니다.', en: 'CA1180P is a PLA+aPHA compound. Distinguish its general/high-heat mold conditions and drying text, and interpret speed % for the actual machine. Do not copy CB0104A settings.' },
        sources: ['ca1180p', 'cb0104a']
      },
      {
        title: { ko: 'PHA 전체의 공통 숫자는 없어요', en: 'Do not assign one set of numbers to all PHA' },
        text: { ko: '원료와 컴파운드의 그레이드·건조·MFR 시험조건을 맞춥니다. 다른 수지의 벤트 깊이·온도·압력·보압비를 복사하지 않고, 출처 없는 숫자는 비워 둡니다.', en: 'Match raw-resin/compound grade, drying and MFR test conditions. Do not copy another material’s vent depth, temperature, pressure or packing ratio; leave unsupported values blank.' },
        sources: ['basf', 'cb0104a', 'ca1180p']
      }
    ],
    checklist: [
      { id: 'flash-material-evidence-v1', text: { ko: '그레이드·lot·배합과 원료/컴파운드를 구분했다.', en: 'Grade, lot, formulation and raw resin versus compound are identified.' } },
      { id: 'flash-moisture-evidence-v1', text: { ko: '해당 재료의 건조·보관·수분 기준을 확인했다.', en: 'Material-specific drying, storage and moisture requirements are checked.' } },
      { id: 'flash-mold-condition-v1', text: { ko: '금형 접촉면·벤트·이젝터와 지지 상태를 승인된 절차로 확인했다.', en: 'Mold interfaces, vents, ejectors and support are checked under the approved procedure.' } },
      { id: 'flash-observed-baseline-v1', text: { ko: '버 위치·캐비티·발생 단계를 기록하고 비교할 제품 기준을 정했다.', en: 'Flash location, cavity and stage are recorded, with a defined part-comparison baseline.' } },
      { id: 'flash-pressure-basis-v1', text: { ko: '유압·사출 수지압·캐비티 압력과 단위를 구분했다.', en: 'Hydraulic, injection melt and cavity pressures and their units are distinguished.' } },
      { id: 'flash-one-change-v1', text: { ko: '허용 범위의 한 가지 변경과 중단·복귀 기준을 정했다.', en: 'One change within permitted limits and its stop/revert criteria are defined.' } },
      { id: 'flash-product-acceptance-v1', text: { ko: '버뿐 아니라 쇼트·싱크·기포·중량·치수·물성도 함께 확인했다.', en: 'Shorts, sinks, voids, mass, dimensions and properties are checked alongside flash.' } }
    ],
    glossary: [
      { term: { ko: '플래시·버', en: 'Flash / burr' }, definition: { ko: '금형 경계 밖으로 밀려 나온 여분의 얇은 수지입니다. 핀 눌림이나 취출 중 찢김과 구분합니다.', en: 'A thin excess of plastic outside the mold boundary. Distinguish it from pin impressions or ejection tears.' } },
      { term: { ko: '파팅 라인', en: 'Parting line' }, definition: { ko: '금형 부품이 맞닿아 갈라지는 경계입니다. 이 부위의 접촉·손상과 압력에 의한 벌어짐을 확인합니다.', en: 'The interface where mold sections meet and separate. Check contact, damage and pressure-driven opening there.' } },
      { term: { ko: 'V/P 전환', en: 'V/P transfer' }, definition: { ko: '속도로 제어하던 충전에서 압력으로 제어하는 단계로 바꾸는 시점입니다. 위치·압력 등 전환 기준은 장비에 따라 다릅니다.', en: 'The change from velocity-controlled filling to pressure control. Transfer criteria, such as position or pressure, depend on the machine.' } },
      { term: { ko: '쿠션', en: 'Cushion' }, definition: { ko: '스크류가 한 사이클 동안 가장 앞으로 갔을 때, 전진 한계까지 남은 거리입니다. 이 공간의 수지 체적으로 표현하기도 합니다. 거리·체적 단위와 측정 기준점, 샷마다의 차이를 확인합니다.', en: 'The remaining distance to the screw\'s forward limit when it reaches its furthest-forward position in the cycle. It can also be expressed as the corresponding melt volume. Check distance or volume units, measurement zero and shot-to-shot variation.' } },
      { term: { ko: '캐비티 압력', en: 'Cavity pressure' }, definition: { ko: '제품 공간 안 수지의 압력으로 위치·시간에 따라 다릅니다. 형체력 계산의 면적 평균값은 기계 유압이나 한 센서값과 같지 않습니다.', en: 'Pressure in the part cavity, varying with location and time. The area average for force calculations is not machine hydraulic pressure or one sensor value.' } },
      { term: { ko: '게이트 씰·고화', en: 'Gate seal / freeze' }, definition: { ko: '열 게이트는 수지 고화로 흐름을 막습니다. 보압시간별 중량·압력으로 확인하며, 밸브 게이트의 기계적 닫힘 시점은 따로 봅니다.', en: 'Thermal gates stop flow by freezing the melt; check with mass versus hold time and pressure. Assess mechanical valve-gate closure separately.' } }
    ]
  };
});
