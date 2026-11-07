(*---
description: Evaluates a random int expression, seed 262, number 6545.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06545 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10063 \in (((1..3 \ {1, 2}) \cap ({1, 2} \ 1..3)) \cap ({b10064 : b10064 \in Nat} \cap (\E b10065 \in 1..3 : 1))) : (((3 * 1..3) \div ([a |-> 1]).a) = <<(0 * b10063), (b10063 * -1)>>)})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 193 to line 14, col 193 of module random_06545 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 186.
    | Expression starting at line 14, column 186.
    | ExtendableExpr starting at line 14, column 185.
    | Expression starting at line 14, column 185.
    | Some << -- >> or >>_ Form starting at line 14, column 169.
    | Fatal errors while parsing TLA+ spec in file random_06545
    | In module random_06545
    | Could not parse module random_06545 from file random_06545.tla
    | *** Errors: 1
    | In module random_06545
    | Could not parse module random_06545 from file random_06545.tla
    3002:1 Parsing or semantic analysis failed.
---*)
