(*---
description: A CASE selector needs two components.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE case_arm_without_second ----
Op == CASE TRUE -> 1 [] FALSE -> 2
Test == Op!1 = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module case_arm_without_second
    | Subexpression of CASE must have form !i!j.
    3002:1 Parsing or semantic analysis failed.
---*)
