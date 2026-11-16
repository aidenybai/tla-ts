(*---
description: Evaluates a random function expression, seed 262, number 3083.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03083 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b4904 \in (1 - 0) |-> (2 + b4904)] EXCEPT ![CASE (<<3, 1, 2>> \o <<>>) -> Cardinality({1, 2}) [] OTHER -> (3 \div 3)] = (CHOOSE b4905 \in (1..3 \cup {x \in 1..3 : x > 1}) : (SUBSET {1} \subseteq SUBSET {1}))] @@ ([b4906 \in (1..3 \ 1..3) |-> (b4906 \div -1)] @@ [b4907 \in DOMAIN (1 :> 2) |-> LET b4908 == b4907 IN -1])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 268 to line 14, col 271 of module random_03083 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 262.
    | Expression starting at line 14, column 262.
    | ExtendableExpr starting at line 14, column 261.
    | Expression starting at line 14, column 261.
    | Some [] Form starting at line 14, column 232.
    | Fatal errors while parsing TLA+ spec in file random_03083
    | In module random_03083
    | Could not parse module random_03083 from file random_03083.tla
    | *** Errors: 1
    | In module random_03083
    | Could not parse module random_03083 from file random_03083.tla
    3002:1 Parsing or semantic analysis failed.
---*)
