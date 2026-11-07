(*---
description: tlapm's own test fast/language/WFTRUE_test.tla.
ref: test/fast/language/WFTRUE_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE WFTRUE_test ----
(* The lexer was not identifying
keywords in fairness subscripts.
For example, WF_TRUE was lexed
as [PUNCT "WF_"; ID "TRUE"],
instead of [PUNCT "WF_"; KWD "TRUE"].
*)

THEOREM WF_TRUE(TRUE) <=> WF_(TRUE)(TRUE)
OBVIOUS

=============================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:1:18:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 18:1:18:8
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./WFTRUE_test.tla", line 9, character 1 to line 20, character 29:
    [INFO]: All 1 obligation proved.
---*)
