(*---
description: Evaluates a random bool expression, seed 262, number 3693.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03693 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b5833 \in DOMAIN [[b5834 \in {1} |-> b5834] EXCEPT ![LET b5835 == 7 IN 3] = (<<>>).a] : (\E b5836 \in {(1 * -1), (<<5, 6>>)[0]} : ([<<1>> EXCEPT ![1] = 2147483647] = [b5837 \in {x \in 1..3 : x > 1} |-> 3]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 126 to line 14, col 126 of module random_03693 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 124.
    | Expression starting at line 14, column 124.
    | ExtendableExpr starting at line 14, column 123.
    | Expression starting at line 14, column 123.
    | Some { } form starting at line 14, column 122.
    | Fatal errors while parsing TLA+ spec in file random_03693
    | In module random_03693
    | Could not parse module random_03693 from file random_03693.tla
    | *** Errors: 1
    | In module random_03693
    | Could not parse module random_03693 from file random_03693.tla
    3002:1 Parsing or semantic analysis failed.
---*)
