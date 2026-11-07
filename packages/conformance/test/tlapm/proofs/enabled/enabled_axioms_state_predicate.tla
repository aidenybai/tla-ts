(*---
description: ENABLEDaxioms moves a state predicate out of ENABLED when the premises are cited steps, replacing the goal by TRUE, which SMT proves.
ref: src/expr/e_action.ml#implication_to_enabled
mode: proof
outcome: proved
---*)
---- MODULE enabled_axioms_state_predicate ----
EXTENDS TLAPS
VARIABLE x, y
P == x = 1
A == x' = 1 /\ y' = 1
THEOREM ASSUME P PROVE P /\ ENABLED A
<1>1. P \in BOOLEAN
  BY DEF P
<1>2. A \in BOOLEAN
  BY DEF A
<1>3. ENABLED (P /\ A)
  BY ExpandENABLED, AutoUSE
<1> QED
  BY <1>1, <1>2, <1>3, ENABLEDaxioms
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 20:3:20:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 20:3:20:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 20:6:20:10
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 20:6:20:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 20:12:20:16
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 20:12:20:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 20:18:20:22
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 20:18:20:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 20:24:20:37
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 20:24:20:37
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 14:3:14:5
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 14:3:14:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 7
    @loc: 16:3:16:5
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 16:3:16:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 8
    @loc: 18:3:18:5
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 18:3:18:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 9
    @loc: 18:6:18:19
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 18:6:18:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 18:21:18:28
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 18:21:18:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 10

    expr has ENABLEDaxioms property ===
    File "./enabled_axioms_state_predicate.tla", line 20, characters 3-4:
    [INFO]
    Proved pconj
    File "./enabled_axioms_state_predicate.tla", line 17, character 21:
    [INFO]: Auto-expanding the definition of operator:  A
    File "./enabled_axioms_state_predicate.tla", line 7, character 1 to line 21, character 4:
    [INFO]: All 10 obligations proved.
---*)
