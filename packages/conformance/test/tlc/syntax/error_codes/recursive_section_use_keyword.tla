(*---
description: 4294 fires for USE in a recursive section.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_section_use_keyword ----
RECURSIVE F
USE TRUE
F == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 8 of module recursive_section_use_keyword
    | A USE or HIDE may not appear within a recursive definition section.
    3002:1 Parsing or semantic analysis failed.
---*)
