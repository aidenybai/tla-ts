(*---
description: An -inv expression that names something undefined fails semantic analysis.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: parse-error
config: |
  INIT Init
  NEXT Next
args:
  - -inv
  - nope = 1
---*)
---- MODULE unknown_identifier ----
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
    2171:0 Parsing or semantic analysis failed.Unknown location

    Semantic error while parsing breakpoint expression "nope = 1"
---*)
