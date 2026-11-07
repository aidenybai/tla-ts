(*---
description: "TLC evaluates M!T without the instance's substitution, so a theorem or assumption reading a substituted constant fails with a null value message instead of evaluating. The cause is SpecProcessor#processConstants, which never visits an imported theorem or assumption body."
ref: "tlc2/tool/impl/Tool.java#evalImpl"
features: [instance, tlc-bug]
outcome: evaluation-failure
---*)
---- MODULE named_theorem_loses_substitution ----
---- MODULE I ----
CONSTANT c
THEOREM T == c = 1
====
M == INSTANCE I WITH c <- 1
ASSUME M!T
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 10 of module named_theorem_loses_substitution failed.
    Cannot invoke "Object.equals(Object)" because "arg1" is null
---*)
