(*---
description: Evaluates a random bool expression, seed 262, number 9760.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09760 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b15151 \in (LET b15152 == ([a |-> 1, b |-> TRUE]).a IN (7 * -1) .. (-LET b15153 == 2147483647 IN b15153)) : (((b15151 % 7) \in ({1, 2} \cup Nat)) => ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] = {b15151, 2}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 78 to line 14, col 78 of module random_09760 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 76.
    | ExtendableExpr starting at line 14, column 75.
    | Expression starting at line 14, column 75.
    | Case Other Arm starting at line 14, column 32.
    | Fatal errors while parsing TLA+ spec in file random_09760
    | In module random_09760
    | Could not parse module random_09760 from file random_09760.tla
    | *** Errors: 1
    | In module random_09760
    | Could not parse module random_09760 from file random_09760.tla
    3002:1 Parsing or semantic analysis failed.
---*)
