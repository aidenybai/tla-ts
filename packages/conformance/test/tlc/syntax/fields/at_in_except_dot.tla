(*---
description: "!.@ is rejected even though @ otherwise reads as an identifier."
ref: "tla2sany/parser/TLAplusParser.java#ExceptComponent"
features: [fields]
outcome: parse-error
---*)
---- MODULE at_in_except_dot ----
Test == [[a |-> 1] EXCEPT !.@ = 2].a = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | @ used in !.@
    | Fatal errors while parsing TLA+ spec in file at_in_except_dot
    | In module at_in_except_dot
    | Could not parse module at_in_except_dot from file at_in_except_dot.tla
    | *** Errors: 1
    | In module at_in_except_dot
    | Could not parse module at_in_except_dot from file at_in_except_dot.tla
    3002:1 Parsing or semantic analysis failed.
---*)
