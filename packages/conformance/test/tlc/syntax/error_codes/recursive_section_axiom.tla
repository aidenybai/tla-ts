(*---
description: 4294 fires for AXIOM in a recursive section.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_section_axiom ----
RECURSIVE F
AXIOM TRUE
F == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 10 of module recursive_section_axiom
    | An ASSUME may not appear within a recursive definition section.
    3002:1 Parsing or semantic analysis failed.
---*)
