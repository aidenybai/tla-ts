(*---
description: A nonfix application of an undefined operator reports it by name.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [operators]
outcome: parse-error
---*)
---- MODULE nonfix_undefined ----
Test == ..(1, 2) = 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 10 of module nonfix_undefined
    | Unknown operator: `..'.
    3002:1 Parsing or semantic analysis failed.
---*)
