(*---
description: "A semantic error in an extended module fails the spec, even if nothing uses it."
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [extends]
includes: [FixUndefined.tla]
outcome: parse-error
---*)
---- MODULE undefined_in_extended ----
EXTENDS FixUndefined
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 2, col 6 to line 2, col 17 of module FixUndefined
    | Unknown operator: `DoesNotExist'.
    | Semantic errors:
    | *** Errors: 1
    | line 2, col 6 to line 2, col 17 of module FixUndefined
    | Unknown operator: `DoesNotExist'.
    3002:1 Parsing or semantic analysis failed.
---*)
