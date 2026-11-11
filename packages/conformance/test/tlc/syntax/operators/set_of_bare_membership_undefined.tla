(*---
description: "{x \\in S} with x undefined is rejected."
ref: "tla2sany/parser/TLAplusParser.java#matchFcnConst"
features: [operators]
outcome: parse-error
---*)
---- MODULE set_of_bare_membership_undefined ----
Test == {x \in {1}} = {1}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 10 to line 8, col 10 of module set_of_bare_membership_undefined
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
