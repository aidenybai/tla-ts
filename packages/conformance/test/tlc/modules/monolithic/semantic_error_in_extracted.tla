(*---
description: A semantic error in an extracted module fails the spec.
ref: "util/FileUtil.java#createNamedInputStream"
features: [monolithic]
outcome: parse-error
---*)
---- MODULE semantic_error_in_extracted ----
EXTENDS Other
====
---- MODULE Other ----
A == Missing
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 2, col 6 to line 2, col 12 of module Other
    | Unknown operator: `Missing'.
    | Semantic errors:
    | *** Errors: 1
    | line 2, col 6 to line 2, col 12 of module Other
    | Unknown operator: `Missing'.
    3002:1 Parsing or semantic analysis failed.
---*)
