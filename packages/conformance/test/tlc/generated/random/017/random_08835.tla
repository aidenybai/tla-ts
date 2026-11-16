(*---
description: Evaluates a random set expression, seed 262, number 8835.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08835 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[b13681 \in (SUBSET {1} \ <<3, 1, 2>>) |-> (2147483647 - b13681)] EXCEPT ![(Head(<<3, 1, 2>>) % ([a |-> 1]).a)] = CASE (\E b13682 \in SUBSET {1} : FALSE) -> (7 * -1) [] OTHER -> Head(<<1, 2>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 184 to line 14, col 184 of module random_08835 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 182.
    | Expression starting at line 14, column 182.
    | ExtendableExpr starting at line 14, column 181.
    | Expression starting at line 14, column 181.
    | Case Arm starting at line 14, column 143.
    | Fatal errors while parsing TLA+ spec in file random_08835
    | In module random_08835
    | Could not parse module random_08835 from file random_08835.tla
    | *** Errors: 1
    | In module random_08835
    | Could not parse module random_08835 from file random_08835.tla
    3002:1 Parsing or semantic analysis failed.
---*)
