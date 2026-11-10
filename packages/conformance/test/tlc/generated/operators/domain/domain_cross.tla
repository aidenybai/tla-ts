(*---
description: domain applied to cross, a SetOfTuplesValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN {1, 2} \X {3})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 16 to line 14, col 21 of module domain_cross and \times.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 23.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | ExtendableExpr starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file domain_cross
    | In module domain_cross
    | Could not parse module domain_cross from file domain_cross.tla
    | *** Errors: 1
    | In module domain_cross
    | Could not parse module domain_cross from file domain_cross.tla
    3002:1 Parsing or semantic analysis failed.
---*)
