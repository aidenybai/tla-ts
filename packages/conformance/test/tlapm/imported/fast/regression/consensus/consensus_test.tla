(*---
description: tlapm's own test fast/regression/consensus/consensus_test.tla.
ref: test/fast/regression/consensus/consensus_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
----------------------------- MODULE consensus_test ------------------------------
EXTENDS FiniteSetTheorems, TLAPS

CONSTANT Value

VARIABLE chosen

Init == chosen = {}
Next == /\ chosen = {}
        /\ \E v \in Value : chosen' = {v}
Spec == Init /\ [][Next]_chosen

-----------------------------------------------------------------------------

Inv == /\ chosen \subseteq Value
       /\ IsFiniteSet(chosen)
       /\ Cardinality(chosen) \leq 1

-----------------------------------------------------------------------------

THEOREM Invariance == Spec => []Inv
<1>1 Init => Inv
  BY FS_EmptySet, SMT DEFS Init, Inv
<1>2. Inv /\ [Next]_chosen => Inv'
  BY FS_Singleton, SMT DEFS Next, Inv
<1>3 QED
  PROOF OMITTED

=============================================================================

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 31:3:31:5
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 31:3:31:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 3
    @loc: 31:6:31:17
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 31:6:31:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 31:19:31:22
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 31:19:31:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 33:3:33:5
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 33:3:33:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 6
    @loc: 33:6:33:18
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 33:6:33:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 33:20:33:23
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 33:20:33:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 6

    Omitted proof at File "./consensus_test.tla", line 35, characters 9-15
    File "./consensus_test.tla", line 9, character 1 to line 37, character 77:
    [ERROR]: Proof incomplete in module "consensus_test": 0 missing, 1 omitted proof step(s).
    File "./consensus_test.tla", line 9, character 1 to line 37, character 77:
    [INFO]: All 6 obligations proved.
---*)
