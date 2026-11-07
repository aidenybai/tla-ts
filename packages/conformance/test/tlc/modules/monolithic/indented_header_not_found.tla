(*---
description: "Extraction matches whole lines, so an indented module header is not found."
ref: "util/MonolithSpecExtractor.java#module"
features: [monolithic]
outcome: parse-error
---*)
---- MODULE indented_header_not_found ----
EXTENDS Other
ASSUME A = 1
====
 ---- MODULE Other ----
A == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file indented_header_not_found
    | In module indented_header_not_found
    | Cannot find source file for module Other imported in module indented_header_not_found.
    | *** Errors: 1
    | In module indented_header_not_found
    | Cannot find source file for module Other imported in module indented_header_not_found.
    3002:1 Parsing or semantic analysis failed.
---*)
