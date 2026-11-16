(*---
description: Evaluates a random set expression, seed 262, number 135.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00135 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b214 \in (DOMAIN (3 :> 3) \ (({1} \cup {1}) \cap UNION {{x \in 1..3 : x > 1}, Nat})) : (\E b215 \in ({b216 \in {1} : FALSE} \cup (b214 \in SUBSET {1})) : ((2 % b214) = (b214 * -1)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 191 to line 14, col 191 of module random_00135 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 186.
    | Expression starting at line 14, column 186.
    | ExtendableExpr starting at line 14, column 185.
    | ExtendableExpr starting at line 14, column 172.
    | Expression starting at line 14, column 172.
    | Fatal errors while parsing TLA+ spec in file random_00135
    | In module random_00135
    | Could not parse module random_00135 from file random_00135.tla
    | *** Errors: 1
    | In module random_00135
    | Could not parse module random_00135 from file random_00135.tla
    3002:1 Parsing or semantic analysis failed.
---*)
