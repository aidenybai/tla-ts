(*---
description: An -inv expression that doesn't parse stops TLC during config processing.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: parse-error
config: |
  INIT Init
  NEXT Next
args:
  - -inv
  - x <
---*)
---- MODULE parse_error ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    2171:1 Parsing or semantic analysis failed.
    2171:0 Parsing or semantic analysis failed.Syntax error while parsing breakpoint expression "x <"
---*)
