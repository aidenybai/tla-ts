(*---
description: Zenon's regression test zenon/regression/misc/test1.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/misc/test1.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---------------------------- MODULE test1 ----------------------------
CONSTANT Set

P(x) == x
Q(x) == {}
A == {x \in Set : P(x)}
B == {x \in Set : Q(x)}

THEOREM A \cup B = {x \in Set : P(x) \/ Q(x)}
PROOF <1>1.  {x \in Set : P(x)} \cup {x \in Set : Q(x)}
               = {x \in Set : P(x) \/ Q(x)}
           PROOF OBVIOUS
      <1>2. QED
           PROOF BY <1>1 DEF A, B
======================================================================

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
    @loc: 23:18:23:25
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 23:18:23:25
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./test1.tla", line 12, character 1 to line 26, character 70:
    [INFO]: All 3 obligations proved.
---*)
