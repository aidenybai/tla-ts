(*---
description: "Extraction compares the whole module name, so a longer name is not a match."
ref: "util/MonolithSpecExtractor.java#module"
features: [monolithic]
outcome: parse-error
---*)
---- MODULE name_is_exact ----
EXTENDS Other
====
---- MODULE Other2 ----
A == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file name_is_exact
    | In module name_is_exact
    | Cannot find source file for module Other imported in module name_is_exact.
    | *** Errors: 1
    | In module name_is_exact
    | Cannot find source file for module Other imported in module name_is_exact.
    3002:1 Parsing or semantic analysis failed.
---*)
