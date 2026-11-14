(*---
description: Zenon's regression test zenon/regression/backend/testarith.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/backend/testarith.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE testarith ----

(* This is just for checking the Isabelle translations. *)

EXTENDS Reals

THEOREM test ==
  ASSUME NEW x, NEW y
  PROVE /\ x + y = x + y
        /\ x - y = x - y
\*        /\ (- x) = (- x)
        /\ x * y = x * y
\*        /\ x / y = x / y
\*        /\ x \div y = x \div y
\*        /\ x % y = x % y
\*        /\ x ^ y = x ^ y
\*        /\ Infinity = Infinity
        /\ x <= y <=> x <= y
        /\ x < y <=> x < y
        /\ x >= y <=> x >= y
        /\ x > y <=> x > y
\*        /\ x .. y = x .. y
OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 34:1:34:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 34:1:34:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./testarith.tla", line 12, character 1 to line 36, character 4:
    [INFO]: All 1 obligation proved.
---*)
