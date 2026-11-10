(*---
description: "belchDEF stops scanning at a PROPOSITION token even when it is a field name, so the next definition gets no definition marker and fails to parse."
ref: "tla2sany/parser/TLAplusParser.java#belchDEF"
features: [fields, tlc-bug]
outcome: parse-error
correct:
  all:
    exit: 0
    transcript: |-
      2190:0 Finished computing initial states: 0 distinct states generated at <date>.
      2193:0 Model checking completed. No error has been found.
        Estimates of the probability that TLC did not check all reachable states
        because two distinct states had the same fingerprint:
        calculated (optimistic):  val = 0.0
      2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 0.
---*)
---- MODULE keyword_field_blocks_next_definition_proposition ----
Op == [PROPOSITION |-> 3].PROPOSITION
Next == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "Next" at line 9, column 1 and token "PROPOSITION" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file keyword_field_blocks_next_definition_proposition
    | In module keyword_field_blocks_next_definition_proposition
    | Could not parse module keyword_field_blocks_next_definition_proposition from file keyword_field_blocks_next_definition_proposition.tla
    | *** Errors: 1
    | In module keyword_field_blocks_next_definition_proposition
    | Could not parse module keyword_field_blocks_next_definition_proposition from file keyword_field_blocks_next_definition_proposition.tla
    3002:1 Parsing or semantic analysis failed.
---*)
