(*---
description: -invlevel -1 pastes the number into a generated expression, and Naturals has no unary minus, so the expression fails semantic analysis.
ref: tlc2/TLC.java#handleParameters
outcome: parse-error
config: |
  INIT Init
  NEXT Next
args:
  - -invlevel
  - "-1"
---*)
---- MODULE level_negative ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    2171:1 Parsing or semantic analysis failed.@!@!@STARTMSG 2171:0 @!@!@
    Parsing or semantic analysis failed.Unknown location

    Semantic error while parsing breakpoint expression "LET _T == INSTANCE TLC _N == INSTANCE Naturals IN _N!<(_T!TLCGet("level"), -1)"
    2171:1 Parsing or semantic analysis failed.@!@!@STARTMSG 2171:0 @!@!@
    Parsing or semantic analysis failed.Unknown location

    Semantic error while parsing breakpoint expression "LET _T == INSTANCE TLC _N == INSTANCE Naturals IN _N!<(_T!TLCGet("level"), -1)"
---*)
