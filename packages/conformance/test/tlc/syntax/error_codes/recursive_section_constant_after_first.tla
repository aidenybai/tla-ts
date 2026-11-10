(*---
description: 4294 fires while a second operator is still undefined.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_section_constant_after_first ----
RECURSIVE F, G
F == 1
CONSTANT c
G == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 10 of module recursive_section_constant_after_first
    | A declaration may not appear within a recursive definition section.
    3002:1 Parsing or semantic analysis failed.
---*)
