(*---
description: Zenon's regression test zenon/regression/misc/test3.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/misc/test3.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
------------------- MODULE test3 --------------

CONSTANT flag

(***
THEOREM (flag \in [{0,1} -> BOOLEAN]) =>
           \A i \in {0,1} : flag[i] \in BOOLEAN
****)
THEOREM (flag \in [{0,1} -> BOOLEAN]) =>
           flag[0] \in BOOLEAN
PROOF <1>1.   0 \in {0,1}
            PROOF OBVIOUS
      <1>  QED
           PROOF BY <1>1
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 25:18:25:20
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 25:18:25:20
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 25:21:25:25
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 25:21:25:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 23:19:23:26
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 23:19:23:26
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./test3.tla", line 12, character 1 to line 26, character 77:
    [INFO]: All 3 obligations proved.
---*)
