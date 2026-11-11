(*---
description: Randomization.java has RandomSubsetSet, but the shipped Randomization.tla does not declare it, so a spec cannot name it.
ref: tla2sany/StandardModules/Randomization.tla
features:
  - Randomization
flags:
  - expression
outcome: parse-error
---*)
---- MODULE sss_not_in_shipped_module ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(0, "0", {1}) = {}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 9 to line 12, col 23 of module sss_not_in_shipped_module
    | Unknown operator: `RandomSubsetSet'.
    3002:1 Parsing or semantic analysis failed.
---*)
