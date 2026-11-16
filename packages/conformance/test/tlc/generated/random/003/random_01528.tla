(*---
description: Evaluates a random set expression, seed 262, number 1528.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01528 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(((2 .. 0) \cup [a |-> 2147483647, b |-> FALSE]) \cup (CASE FALSE -> 2147483647 [] OTHER -> 3 .. (1 * 0))), ({(SUBSET {1} + b2426) : b2426 \in ({2, 1, 3} \ 2..1)} \cup DOMAIN (3 :> -1))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 134 to line 14, col 139 of module random_01528 and +.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 141.
    | Expression starting at line 14, column 134.
    | ExtendableExpr starting at line 14, column 133.
    | Expression starting at line 14, column 133.
    | Some { } form starting at line 14, column 132.
    | Fatal errors while parsing TLA+ spec in file random_01528
    | In module random_01528
    | Could not parse module random_01528 from file random_01528.tla
    | *** Errors: 1
    | In module random_01528
    | Could not parse module random_01528 from file random_01528.tla
    3002:1 Parsing or semantic analysis failed.
---*)
