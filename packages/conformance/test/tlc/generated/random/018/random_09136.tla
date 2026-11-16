(*---
description: Evaluates a random bool expression, seed 262, number 9136.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09136 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b14184 \in {((3 % 2) - (CHOOSE b14185 \in (1 :> 2) : FALSE)), (-(3 \div -1))} : ((~(FALSE /\ FALSE)) => (\E b14186 \in {b14187 \in {x \in 1..3 : x > 1} : FALSE} : (\E b14188 \in SUBSET {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 87 to line 14, col 90 of module random_09136 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 85.
    | Expression starting at line 14, column 85.
    | ExtendableExpr starting at line 14, column 84.
    | Expression starting at line 14, column 83.
    | ExtendableExpr starting at line 14, column 82.
    | Fatal errors while parsing TLA+ spec in file random_09136
    | In module random_09136
    | Could not parse module random_09136 from file random_09136.tla
    | *** Errors: 1
    | In module random_09136
    | Could not parse module random_09136 from file random_09136.tla
    3002:1 Parsing or semantic analysis failed.
---*)
