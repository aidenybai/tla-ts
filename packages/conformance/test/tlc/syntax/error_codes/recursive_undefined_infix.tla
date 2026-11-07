(*---
description: 4291 fires for an undefined infix operator.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_undefined_infix ----
RECURSIVE _ ++ _
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 11 to line 8, col 16 of module recursive_undefined_infix
    | Symbol ++ declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
