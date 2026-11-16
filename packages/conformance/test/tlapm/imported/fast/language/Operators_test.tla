(*---
description: tlapm's own test fast/language/Operators_test.tla.
ref: test/fast/language/Operators_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
--------------- MODULE Operators_test -------------
(* test definability of all user-definable infix, prefix, and postfix
   operators *)

z - y == z  \* SANY doesn't accept "BY/USE DEF -".  This is unlikely to
            \* be fixed soon.
z + y == z
z * y == z
z / y == z
z ^ y == z
z < y == z
z > y == z
z .. y == z
z ... y == z
z | y == z
z || y == z
z & y == z
z && y == z
z $ y == z
z $$ y == z
z ?? y == z
z %% y == z
z ## y == z
z ++ y == z
z -- y == z
z ** y == z
z // y == z
z ^^ y == z
z @@ y == z
z !! y == z
z |- y == z
z |= y == z
z -| y == z
z =| y == z
z <: y == z
z :> y == z
z := y == z
z ::= y == z
z (+) y == z
z (-) y == z
z (\X) y == z
z (/) y == z
z (.) y == z
z \uplus y == z
z \sqcap y == z
z \sqcup y == z
z \div y == z
z \wr y == z
z \star y == z
z \bigcirc y == z
z \bullet y == z
z \prec y == z
z \succ y == z
z \preceq y == z
z \succeq y == z
z \sim y == z
z \simeq y == z
z \ll y == z
z \gg y == z
z \asymp y == z
z \subset y == z
z \supset y == z
z \supseteq y == z
z \approx y == z
z \cong y == z
z \sqsubset y == z
z \sqsupset y == z
z \sqsubseteq y == z
z \sqsupseteq y == z
z \doteq y == z
z \propto y == z
-----------------------------------------------------------------------------
THEOREM
\A y, z :
/\ z - y = z
/\ z + y = z
/\ z * y = z
/\ z / y = z
/\ z ^ y = z
/\ (z < y) = z
/\ (z > y) = z
/\ z .. y = z
/\ z ... y = z
/\ z | y = z
/\ z || y = z
/\ z & y = z
/\ z && y = z
/\ z $ y = z
/\ z $$ y = z
/\ z ?? y = z
/\ z %% y = z
/\ z ## y = z
/\ z ++ y = z
/\ z -- y = z
/\ z ** y = z
/\ z // y = z
/\ z ^^ y = z
/\ z @@ y = z
/\ z !! y = z
/\ (z |- y) = z
/\ (z |= y) = z
/\ (z -| y) = z
/\ (z =| y) = z
/\ z <: y = z
/\ z :> y = z
/\ (z := y) = z
/\ (z ::= y) = z
/\ (z (+)  z) = z
/\ (z (-)  z) = z
/\ (z (\X) z) = z
/\ (z (/)  z) = z
/\ (z (.)  z) = z
/\ z \uplus y = z
/\ z \sqcap y = z
/\ z \sqcup y = z
/\ z \div y = z
/\ z \wr y = z
/\ z \star y = z
/\ z \bigcirc y = z
/\ z \bullet y = z
/\ (z \prec y) = z
/\ (z \succ y) = z
/\ (z \preceq y) = z
/\ (z \succeq y) = z
/\ (z \sim y) = z
/\ (z \simeq y) = z
/\ (z \ll y) = z
/\ (z \gg y) = z
/\ (z \asymp y) = z
/\ (z \subset y) = z
/\ (z \supset y) = z
/\ (z \supseteq y) = z
/\ (z \approx y) = z
/\ (z \cong y) = z
/\ (z \sqsubset y) = z
/\ (z \sqsupset y) = z
/\ (z \sqsubseteq y) = z
/\ (z \sqsupseteq y) = z
/\ (z \doteq y) = z
/\ (z \propto y) = z
BY DEF - , + , * , / , ^ , < , > , ..  , ...  , | , || , & , && , $ ,
$$ , ??  , %% , ## , ++ , -- , ** , // , ^^ , @@ , !! , |- , |= , -| ,
=| , <: , :> , := , ::= , \oplus , \ominus , \otimes , \oslash , \odot ,
\uplus , \sqcap , \sqcup , \div , \wr , \star , \bigcirc , \bullet ,
\prec , \succ , \preceq , \succeq , \sim , \simeq , \ll , \gg ,
\asymp , \subset , \supset , \supseteq , \approx , \cong , \sqsubset ,
\sqsupset , \sqsubseteq , \sqsupseteq , \doteq , \propto

-----------------------------------------------------------------------------
z ^+ == z
z ^* == z
z ^# == z
-. z == z

THEOREM
\A z :
/\ z ^+ = z
/\ z ^* = z
/\ z ^# = z
/\ -z = z
BY DEF  ^+, ^*, ^#, -.

=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 149:1:149:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 149:1:149:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 169:1:169:3
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 169:1:169:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./Operators_test.tla", line 9, character 1 to line 171, character 77:
    [INFO]: All 2 obligations proved.
---*)
