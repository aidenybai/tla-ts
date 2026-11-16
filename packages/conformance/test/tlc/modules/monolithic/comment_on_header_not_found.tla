(*---
description: "Extraction matches whole lines, so a module header with a trailing comment is not found."
ref: "util/MonolithSpecExtractor.java#module"
features: [monolithic]
outcome: parse-error
---*)
---- MODULE comment_on_header_not_found ----
EXTENDS Other
ASSUME A = 1
====
---- MODULE Other ---- \* note
A == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file comment_on_header_not_found
    | In module comment_on_header_not_found
    | Cannot find source file for module Other imported in module comment_on_header_not_found.
    | *** Errors: 1
    | In module comment_on_header_not_found
    | Cannot find source file for module Other imported in module comment_on_header_not_found.
    3002:1 Parsing or semantic analysis failed.
---*)
