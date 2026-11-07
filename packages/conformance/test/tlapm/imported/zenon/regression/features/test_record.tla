(*---
description: Zenon's regression test zenon/regression/features/test_record.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/features/test_record.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE test_record ----

(* <= 7 fields *)
THEOREM [f1 |-> "v1", f2 |-> "v2"] \in [f1 : {"v1"}, f2 : {"v2"}]
OBVIOUS

(* > 7 fields *)
THEOREM [
  f1 |-> "v1",
  f2 |-> "v2",
  f3 |-> "v3",
  f4 |-> "v4",
  f5 |-> "v5",
  f6 |-> "v6",
  f7 |-> "v7",
  f8 |-> "v8",
  f9 |-> "v9",
  f10 |-> "v10",
  f11 |-> "v11",
  f12 |-> "v12",
  f13 |-> "v13",
  f14 |-> "v14",
  f15 |-> "v15",
  f16 |-> "v16",
  f17 |-> "v17",
  f18 |-> "v18",
  f19 |-> "v19",
  f20 |-> "v20",
  f21 |-> "v21",
  f22 |-> "v22",
  f23 |-> "v23",
  f24 |-> "v24",
  f25 |-> "v25",
  f26 |-> "v26",
  f27 |-> "v27",
  f28 |-> "v28",
  f29 |-> "v29",
  f30 |-> "v30"
] \in [
  f1 : {"v1"},
  f2 : {"v2"},
  f3 : {"v3"},
  f4 : {"v4"},
  f5 : {"v5"},
  f6 : {"v6"},
  f7 : {"v7"},
  f8 : {"v8"},
  f9 : {"v9"},
  f10 : {"v10"},
  f11 : {"v11"},
  f12 : {"v12"},
  f13 : {"v13"},
  f14 : {"v14"},
  f15 : {"v15"},
  f16 : {"v16"},
  f17 : {"v17"},
  f18 : {"v18"},
  f19 : {"v19"},
  f20 : {"v20"},
  f21 : {"v21"},
  f22 : {"v22"},
  f23 : {"v23"},
  f24 : {"v24"},
  f25 : {"v25"},
  f26 : {"v26"},
  f27 : {"v27"},
  f28 : {"v28"},
  f29 : {"v29"},
  f30 : {"v30"}
]
OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:1:16:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:1:16:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 82:1:82:8
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 82:1:82:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./test_record.tla", line 12, character 1 to line 84, character 4:
    [INFO]: All 2 obligations proved.
---*)
