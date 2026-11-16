(*---
description: "An ASSUME/PROVE theorem's assumptions and goal are operands."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE assume_prove_clauses ----
THEOREM T == ASSUME 1 = 1 PROVE 2 = 2
Test == T!1 /\ T!2
====

(*--- recorded
all:
  exit: 0
---*)
