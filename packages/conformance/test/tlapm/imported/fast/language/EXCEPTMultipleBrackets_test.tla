(*---
description: tlapm's own test fast/language/EXCEPTMultipleBrackets_test.tla.
ref: test/fast/language/EXCEPTMultipleBrackets_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
----------------------- MODULE EXCEPTMultipleBrackets_test ---------------------
(* Test that consecutive brackets and `@` in an `EXCEPT` assignment are
correctly interpreted in the presence of multiple (comma-separated) assignments.
*)
EXTENDS Integers


f == [x \in {1} |-> [y \in {2} |-> 3]]
g == [f EXCEPT ![1][2] = 1]


THEOREM g[1][2] = 1
BY DEF g, f


h == [f EXCEPT ![1][2] = @ + 1]


THEOREM h[1][2] = 4
BY DEF h, f


t == [f EXCEPT ![1][2] = 1, ![1][2] = @ + 1]


THEOREM t[1][2] = 2
BY DEF t, f

================================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 21:1:21:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 21:1:21:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 28:1:28:3
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 28:1:28:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 3
    @loc: 35:1:35:3
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 35:1:35:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./EXCEPTMultipleBrackets_test.tla", line 9, character 1 to line 37, character 80:
    [INFO]: All 3 obligations proved.
---*)
