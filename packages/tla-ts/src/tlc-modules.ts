// Data copied from tla2tools.jar (2026.10.24) that TLC's string and variable order depend on.

export const SANY_BUILTINS = [
  "STRING",
  "FALSE",
  "TRUE",
  "BOOLEAN",
  "=",
  "/=",
  ".",
  "'",
  "\\lnot",
  "\\neg",
  "\\land",
  "\\lor",
  "\\equiv",
  "=>",
  "SUBSET",
  "UNION",
  "DOMAIN",
  "\\subseteq",
  "\\in",
  "\\notin",
  "\\",
  "\\intersect",
  "\\union",
  "\\times",
  "~>",
  "[]",
  "<>",
  "ENABLED",
  "UNCHANGED",
  "\\cdot",
  "-+->",
  "$AngleAct",
  "$BoundedChoose",
  "$BoundedExists",
  "$BoundedForall",
  "$CartesianProd",
  "$Case",
  "$ConjList",
  "$DisjList",
  "$Except",
  "$FcnApply",
  "$FcnConstructor",
  "$IfThenElse",
  "$NonRecursiveFcnSpec",
  "$Pair",
  "$RcdConstructor",
  "$RcdSelect",
  "$RecursiveFcnSpec",
  "$Seq",
  "$SetEnumerate",
  "$SetOfAll",
  "$SetOfFcns",
  "$SetOfRcds",
  "$SF",
  "$SquareAct",
  "$SubsetOf",
  "$TemporalExists",
  "$TemporalForall",
  "$TemporalWhile",
  "$Tuple",
  "$UnboundedChoose",
  "$UnboundedExists",
  "$UnboundedForall",
  "$WF",
  "$Nop",
  "$Qed",
  "$Pfcase",
  "$Have",
  "$Take",
  "$Pick",
  "$Witness",
  "$Suffices",
];

export const SANY_OPERATOR_SYNONYMS = [
  ["\\lnot", "~", "\\neg", "¬"],
  ["[]", "□"],
  ["<>", "◇"],
  ["\\land", "/\\", "∧"],
  ["\\lor", "\\/", "∨"],
  ["\\equiv", "<=>", "≡", "⇔"],
  ["/=", "#", "≠"],
  ["\\leq", "<=", "=<", "≤"],
  ["\\geq", ">=", "≥"],
  ["\\times", "\\X", "×"],
  ["\\intersect", "\\cap", "∩"],
  ["\\union", "\\cup", "∪"],
  ["\\o", "\\circ", "∘"],
  ["\\oplus", "(+)", "⊕"],
  ["\\ominus", "(-)", "⊖"],
  ["\\odot", "(.)", "⊙"],
  ["\\oslash", "(/)", "⊘"],
  ["\\otimes", "(\\X)", "⊗"],
  ["\\approx", "≈"],
  [":=", "≔"],
  ["\\asymp", "≍"],
  ["\\bigcirc", "◯"],
  ["::=", "⩴"],
  ["\\bullet", "●"],
  ["\\cdot", "⋅"],
  ["\\cong", "≅"],
  ["\\div", "÷"],
  ["\\doteq", "≐"],
  ["..", "‥"],
  ["...", "…"],
  ["!!", "‼"],
  ["\\gg", "≫"],
  ["=>", "⇒"],
  ["\\in", "∈"],
  ["=|", "⫤"],
  ["~>", "↝"],
  ["\\ll", "≪"],
  ["-|", "⊣"],
  ["\\notin", "∉"],
  ["-+->", "⇸"],
  ["\\prec", "≺"],
  ["\\preceq", "⪯"],
  ["\\propto", "∝"],
  ["??", "⁇"],
  ["|=", "⊨"],
  ["|-", "⊢"],
  ["\\sim", "∼"],
  ["\\simeq", "≃"],
  ["\\sqcap", "⊓"],
  ["\\sqcup", "⊔"],
  ["\\sqsubset", "⊏"],
  ["\\sqsubseteq", "⊑"],
  ["\\sqsupset", "⊐"],
  ["\\sqsupseteq", "⊒"],
  ["\\star", "⋆"],
  ["\\subset", "⊂"],
  ["\\subseteq", "⊆"],
  ["\\succ", "≻"],
  ["\\succeq", "⪰"],
  ["\\supset", "⊃"],
  ["\\supseteq", "⊇"],
  ["\\uplus", "⊎"],
  ["||", "‖"],
  ["\\wr", "≀"],
  ["^+", "⁺"],
];

export const TLC_STARTUP_STRINGS = [
  "STRING",
  "FALSE",
  "TRUE",
  "BOOLEAN",
  "=",
  "/=",
  ".",
  "'",
  "\\lnot",
  "\\neg",
  "\\land",
  "\\lor",
  "\\equiv",
  "=>",
  "SUBSET",
  "UNION",
  "DOMAIN",
  "\\subseteq",
  "\\in",
  "\\notin",
  "\\",
  "\\intersect",
  "\\union",
  "\\times",
  "~>",
  "[]",
  "<>",
  "ENABLED",
  "UNCHANGED",
  "\\cdot",
  "-+->",
  "$AngleAct",
  "$BoundedChoose",
  "$BoundedExists",
  "$BoundedForall",
  "$CartesianProd",
  "$Case",
  "$ConjList",
  "$DisjList",
  "$Except",
  "$FcnApply",
  "$FcnConstructor",
  "$IfThenElse",
  "$NonRecursiveFcnSpec",
  "$Pair",
  "$RcdConstructor",
  "$RcdSelect",
  "$RecursiveFcnSpec",
  "$Seq",
  "$SetEnumerate",
  "$SetOfAll",
  "$SetOfFcns",
  "$SetOfRcds",
  "$SF",
  "$SquareAct",
  "$SubsetOf",
  "$TemporalExists",
  "$TemporalForall",
  "$TemporalWhile",
  "$Tuple",
  "$UnboundedChoose",
  "$UnboundedExists",
  "$UnboundedForall",
  "$WF",
  "$Nop",
  "$Qed",
  "$Pfcase",
  "$Have",
  "$Take",
  "$Pick",
  "$Witness",
  "$Suffices",
  "***I do not exist***",
  "--TLA+ BUILTINS--",
  "Formal_0",
  "Formal_1",
  "Formal_2",
  "[",
  "^",
  "/",
  "*",
  "-",
  "-.",
  "+",
  "^+",
  "^*",
  "^#",
  "<",
  "\\leq",
  ">",
  "\\geq",
  "...",
  "..",
  "|",
  "||",
  "&&",
  "&",
  "$$",
  "$",
  "??",
  "%%",
  "%",
  "##",
  "++",
  "--",
  "**",
  "//",
  "^^",
  "@@",
  "!!",
  "|-",
  "|=",
  "-|",
  "=|",
  "<:",
  ":>",
  ":=",
  "::=",
  "\\oplus",
  "\\ominus",
  "\\odot",
  "\\oslash",
  "\\otimes",
  "\\uplus",
  "\\sqcap",
  "\\sqcup",
  "\\div",
  "\\wr",
  "\\star",
  "\\o",
  "\\bigcirc",
  "\\bullet",
  "\\prec",
  "\\succ",
  "\\preceq",
  "\\succeq",
  "\\sim",
  "\\simeq",
  "\\ll",
  "\\gg",
  "\\asymp",
  "\\subset",
  "\\supset",
  "\\supseteq",
  "\\approx",
  "\\cong",
  "\\sqsubset",
  "\\sqsubseteq",
  "\\sqsupset",
  "\\sqsupseteq",
  "\\doteq",
  "\\propto",
  "~",
  "¬",
  "□",
  "◇",
  "/\\",
  "∧",
  "\\/",
  "∨",
  "<=>",
  "≡",
  "⇔",
  "#",
  "≠",
  "<=",
  "=<",
  "≤",
  ">=",
  "≥",
  "\\X",
  "×",
  "\\cap",
  "∩",
  "\\cup",
  "∪",
  "\\circ",
  "∘",
  "(+)",
  "⊕",
  "(-)",
  "⊖",
  "(.)",
  "⊙",
  "(/)",
  "⊘",
  "(\\X)",
  "⊗",
  "≈",
  "≔",
  "≍",
  "◯",
  "⩴",
  "●",
  "⋅",
  "≅",
  "÷",
  "≐",
  "‥",
  "…",
  "‼",
  "≫",
  "⇒",
  "∈",
  "⫤",
  "↝",
  "≪",
  "⊣",
  "∉",
  "⇸",
  "≺",
  "⪯",
  "∝",
  "⁇",
  "⊨",
  "⊢",
  "∼",
  "≃",
  "⊓",
  "⊔",
  "⊏",
  "⊑",
  "⊐",
  "⊒",
  "⋆",
  "⊂",
  "⊆",
  "≻",
  "⪰",
  "⊃",
  "⊇",
  "⊎",
  "‖",
  "≀",
  "⁺",
  "@",
];

export const SANY_NODE_NAMES = [
  "Not a node",
  "N_ActDecl",
  "N_ActionExpr",
  "N_AssumeDecl",
  "N_AssumeProve",
  "N_Assumption",
  "N_BeginModule",
  "N_Body",
  "N_BoundedQuant",
  "N_Case",
  "N_CaseArm",
  "N_CaseStatement",
  "N_ChooseStatement",
  "N_ConjItem",
  "N_ConjList",
  "N_ConsDecl",
  "N_DisjItem",
  "N_DisjList",
  "N_EndModule",
  "N_Except",
  "N_ExceptComponent",
  "N_ExceptSpec",
  "N_Times",
  "N_Extends",
  "N_FairnessExpr",
  "N_FcnAppl",
  "N_FcnConst",
  "N_FieldSet",
  "N_FieldVal",
  "N_FunctionDefinition",
  "N_FunctionParam",
  "N_GeneralId",
  "N_GenInfixOp",
  "N_GenNonExpPrefixOp",
  "N_GenPostfixOp",
  "N_GenPrefixOp",
  "N_IdentDecl",
  "N_Real",
  "N_IdentifierTuple",
  "N_IdentLHS",
  "N_IdPrefix",
  "N_IdPrefixElement",
  "N_IfThenElse",
  "N_InfixDecl",
  "N_InfixExpr",
  "N_InfixLHS",
  "N_InfixOp",
  "N_InnerProof",
  "N_Instance",
  "N_NonLocalInstance",
  "N_Integer",
  "N_LeafProof",
  "N_LetDefinitions",
  "N_LetIn",
  "N_MaybeBound",
  "N_Module",
  "N_ModuleDefinition",
  "N_NonExpPrefixOp",
  "N_Number",
  "N_NumberedAssumeProve",
  "N_OpApplication",
  "N_OpArgs",
  "N_OperatorDefinition",
  "N_OtherArm",
  "N_ParamDecl",
  "N_ParamDeclaration",
  "N_ParenExpr",
  "N_PostfixDecl",
  "N_PostfixExpr",
  "N_PostfixLHS",
  "N_PostfixOp",
  "N_PrefixDecl",
  "N_PrefixExpr",
  "N_PrefixLHS",
  "N_PrefixOp",
  "N_Proof",
  "N_ProofLet",
  "N_ProofName",
  "N_ProofStatement",
  "N_ProofStep",
  "N_QEDStep",
  "N_QuantBound",
  "N_RcdConstructor",
  "N_RecordComponent",
  "N_SetEnumerate",
  "N_SetOfAll",
  "N_SetOfFcns",
  "N_SetOfRcds",
  "N_String",
  "N_SubsetOf",
  "N_Substitution",
  "N_TempDecl",
  "N_Theorem",
  "N_Tuple",
  "N_UnBoundedOrBoundedChoose",
  "N_UnboundedQuant",
  "N_VariableDeclaration",
  "Token =",
  "Token \\in",
  "N_NewSymb",
  "N_Lambda",
  "N_Recursive",
  "N_Label",
  "N_StructOp",
  "N_NumerableStep",
  "N_TerminalProof",
  "N_UseOrHide",
  "N_NonExprBody",
  "N_DefStep",
  "N_HaveStep",
  "N_TakeStep",
  "N_WitnessStep",
  "N_PickStep",
  "N_CaseStep",
  "N_AssertStep",
];

export const TLC_MODULE_SOURCES = new Map([
  [
    "Naturals",
    `-------------------------------- MODULE Naturals ----------------------------
Nat       == { }
a+b       == {a, b}
a-b       == CHOOSE n : b + n = a
a*b       == TRUE
a^b       == {a, b}
a<b       ==  a = b
a>b       ==  a = b
a \\leq b  ==  a = b
a \\geq b  ==  a = b
a % b     ==  {a, b}
a \\div b  ==  {a, b}
a .. b    ==  {a, b}
=============================================================================
`,
  ],
  [
    "Integers",
    `-------------------------------- MODULE Integers ----------------------------
EXTENDS Naturals
Int  ==  { }
-. a == 0 - a
=============================================================================
`,
  ],
  [
    "Sequences",
    `------------------------------ MODULE Sequences -----------------------------
LOCAL INSTANCE Naturals
Seq(S) == UNION {[1..n -> S] : n \\in Nat}
Len(s) == CHOOSE n \\in Nat : DOMAIN s = 1..n
s \\o t == [i \\in 1..(Len(s) + Len(t)) |-> IF i \\leq Len(s) THEN s[i]
                                                           ELSE t[i-Len(s)]]
Append(s, e) == s \\o <<e>>
Head(s) == s[1]
Tail(s) == CASE s # << >> -> [i \\in 1..(Len(s)-1) |-> s[i+1]]
SubSeq(s, m, n) == [i \\in 1..(1+n-m) |-> s[i+m-1]]
SelectSeq(s, Test(_)) ==
  LET F[i \\in 0..Len(s)] ==
        IF i = 0 THEN << >>
                 ELSE IF Test(s[i]) THEN Append(F[i-1], s[i])
                                    ELSE F[i-1]
  IN F[Len(s)]
=============================================================================
`,
  ],
  [
    "FiniteSets",
    `---------------------------- MODULE FiniteSets -----------------------------
LOCAL INSTANCE Naturals
LOCAL INSTANCE Sequences
IsFiniteSet(S) ==
  \\E seq \\in Seq(S) : \\A s \\in S : \\E n \\in 1..Len(seq) : seq[n] = s
Cardinality(S) ==
  LET CS[T \\in SUBSET S] == IF T = {} THEN 0
                                      ELSE 1 + CS[T \\ {CHOOSE x : x \\in T}]
  IN  CS[S]
=============================================================================
`,
  ],
  [
    "TLC",
    `------------------------------- MODULE TLC ----------------------------------
LOCAL INSTANCE Naturals
LOCAL INSTANCE Sequences
LOCAL INSTANCE FiniteSets
-----------------------------------------------------------------------------
Print(out, val) == val
PrintT(out) == TRUE
Assert(val, out) == IF val = TRUE THEN TRUE
                                  ELSE CHOOSE v : TRUE
JavaTime == CHOOSE n : n \\in Nat
TLCGet(i) == CHOOSE n : TRUE
TLCSet(i, v) == TRUE
-----------------------------------------------------------------------------
d :> e == [x \\in {d} |-> e]
f @@ g == [x \\in (DOMAIN f) \\cup (DOMAIN g) |->
            IF x \\in DOMAIN f THEN f[x] ELSE g[x]]
Permutations(S) ==
   {f \\in [S -> S] : \\A w \\in S : \\E v \\in S : f[v]=w}
-----------------------------------------------------------------------------
SortSeq(s, Op(_, _)) ==
    LET Perm == CHOOSE p \\in Permutations(1 .. Len(s)) :
                  \\A i, j \\in 1..Len(s) :
                     (i < j) => Op(s[p[i]], s[p[j]]) \\/ (s[p[i]] = s[p[j]])
    IN  [i \\in 1..Len(s) |-> s[Perm[i]]]
RandomElement(s) == CHOOSE x \\in s : TRUE
Any == CHOOSE x : TRUE
ToString(v) == (CHOOSE x \\in [a : v, b : STRING] : TRUE).b
TLCEval(v) == v
=============================================================================
`,
  ],
  [
    "TLCExt",
    `------------------------------- MODULE TLCExt -------------------------------
LOCAL INSTANCE TLC
LOCAL INSTANCE Integers
-----------------------------------------------------------------------------
AssertEq(a, b) ==
    IF a # b THEN
        /\\ PrintT("Assertion failed")
        /\\ PrintT(a)
        /\\ PrintT(b)
        /\\ a = b
    ELSE a = b
AssertError(err, exp) ==
    LET FailsEval(e) == CHOOSE b \\in BOOLEAN : TRUE
        TLCError     == CHOOSE s \\in STRING  : TRUE
    IN IF FailsEval(exp) THEN Assert(err = TLCError, TLCError) ELSE TRUE
-----------------------------------------------------------------------------
TLCGetOrDefault(key, defaultVal) ==
  CHOOSE n : TRUE
TLCGetAndSet(key, Op(_,_), val, defaultVal) ==
  LET oldVal == TLCGetOrDefault(key, defaultVal)
  IN CHOOSE v \\in {oldVal} : TLCSet(key, Op(oldVal, val))
-----------------------------------------------------------------------------
Trace ==
  TRUE
-----------------------------------------------------------------------------
CounterExample ==
    TRUE
ToTrace(CE) ==
	TRUE
-----------------------------------------------------------------------------
TLCModelValue(str) ==
  CHOOSE v: ToString(v) = str
TLCDefer(expression) ==
  TRUE
-----------------------------------------------------------------------------
TLCNoOp(val) ==
  val
PickSuccessor(exp) ==
  IF (exp)
  THEN TRUE
  ELSE CHOOSE bool \\in BOOLEAN : TRUE
-----------------------------------------------------------------------------
TLCCache(expression, closure) ==
  expression
TLCFP(var) ==
  CHOOSE i \\in Int: TRUE
-----------------------------------------------------------------------------
TLCEvalDefinition(definitionName) ==
  TRUE
============================================================================
`,
  ],
  [
    "Bags",
    `----------------------------- MODULE Bags --------------------------------
LOCAL INSTANCE Naturals
IsABag(B) ==
  B \\in [DOMAIN B -> {n \\in Nat : n > 0}]
BagToSet(B) == DOMAIN B
SetToBag(S) == [e \\in S |-> 1]
BagIn(e,B) == e \\in BagToSet(B)
EmptyBag == SetToBag({})
B1 (+) B2  ==
  [e \\in (DOMAIN B1) \\cup (DOMAIN B2) |->
      (IF e \\in DOMAIN B1 THEN B1[e] ELSE 0)
    + (IF e \\in DOMAIN B2 THEN B2[e] ELSE 0) ]
B1 (-) B2  ==
  LET B == [e \\in DOMAIN B1 |-> IF e \\in DOMAIN B2 THEN B1[e] - B2[e]
                                                   ELSE B1[e]]
  IN  [e \\in {d \\in DOMAIN B : B[d] > 0} |-> B[e]]
LOCAL Sum(f) ==
        LET DSum[S \\in SUBSET DOMAIN f] ==
               LET elt == CHOOSE e \\in S : TRUE
               IN  IF S = {} THEN 0
                             ELSE f[elt] + DSum[S \\ {elt}]
        IN  DSum[DOMAIN f]
BagUnion(S) ==
  [e \\in UNION {BagToSet(B) : B \\in S} |->
    Sum( [B \\in S |-> IF BagIn(e, B) THEN B[e] ELSE 0] ) ]
B1 \\sqsubseteq B2  ==
  /\\ (DOMAIN B1) \\subseteq (DOMAIN B2)
  /\\ \\A e \\in DOMAIN B1 : B1[e] \\leq B2[e]
SubBag(B) ==
  LET RemoveFromDom(x, f) == [y \\in (DOMAIN f) \\ {x} |-> f[y]]
      Combine(x, BagSet) ==
         BagSet \\cup
          {[y \\in (DOMAIN f) \\cup {x} |-> IF y = x THEN i ELSE f[y]] :
                f \\in BagSet, i \\in 1..B[x]}
      Biggest == LET Range == {B[x] : x \\in DOMAIN B}
                 IN  IF Range = {} THEN 0
                                   ELSE CHOOSE r \\in Range :
                                           \\A s \\in Range : r \\geq s
      RSB[BB \\in UNION {[S -> 1..Biggest] : S \\in SUBSET DOMAIN B}] ==
        IF BB = << >> THEN {<< >>}
                      ELSE LET x == CHOOSE x \\in DOMAIN BB : TRUE
                           IN  Combine(x, RSB[RemoveFromDom(x, BB)])
  IN RSB[B]
BagOfAll(F(_), B) ==
  [e \\in {F(d) : d \\in BagToSet(B)} |->
     Sum( [d \\in BagToSet(B) |-> IF F(d) = e THEN B[d] ELSE 0] ) ]
BagCardinality(B) ==
  Sum(B)
CopiesIn(e, B) ==
  IF BagIn(e, B) THEN B[e] ELSE 0
=============================================================================
 6 Apr 99 : Modified version for standard module set
 7 Dec 98 : Corrected error found by Stephan Merz.
 6 Dec 98 : Modified comments based on suggestions by Lyle Ramshaw.
 5 Dec 98 : Initial version.
`,
  ],
  [
    "Json",
    `-------------------------------- MODULE Json --------------------------------
LOCAL INSTANCE Sequences
LOCAL INSTANCE FiniteSets
LOCAL INSTANCE TLC
-----------------------------------------------------------------------------
LOCAL IsSequence(F, D) == TRUE \\/ FALSE
LOCAL ToJsonKeyValue(F, d) ==
  ToString(ToString(d)) \\o ":" \\o ToString(F[d])
RECURSIVE ToJsonObjectString(_,_)
LOCAL ToJsonObjectString(F, D) ==
  LET d == CHOOSE d \\in D: TRUE
  IN IF D = DOMAIN F
     THEN "{" \\o ToJsonKeyValue(F, d) \\o IF D \\ {d} = {}
                                         THEN "}"
                                         ELSE ToJsonObjectString(F, D \\ {d})
     ELSE ", " \\o ToJsonKeyValue(F, d) \\o IF D \\ {d} = {}
                                          THEN "}"
                                          ELSE ToJsonObjectString(F, D \\ {d})
RECURSIVE ToJsonArrayString(_,_)
LOCAL ToJsonArrayString(F, D) ==
  LET d == CHOOSE d \\in D: TRUE
  IN IF D = DOMAIN F
     THEN "[" \\o ToString(F[d]) \\o IF D \\ {d} = {}
                                   THEN "]"
                                   ELSE ToJsonArrayString(F, D \\ {d})
     ELSE ", " \\o ToString(F[d]) \\o IF D \\ {d} = {}
                                    THEN "]"
                                    ELSE ToJsonArrayString(F, D \\ {d})
RECURSIVE ToJsonString(_,_)
LOCAL ToJsonString(F, D) ==
  IF IsFiniteSet(F) \\/ IsSequence(F, D) THEN
    ToJsonArrayString(F, D)
  ELSE
    ToJsonObjectString(F, D)
ToJson(value) ==
  IF DOMAIN value = {} THEN
    "{}"
  ELSE
    ToJsonString(value, DOMAIN value)
ToJsonArray(value) ==
  IF DOMAIN value = {} THEN
    "[]"
  ELSE
    ToJsonArrayString(value, DOMAIN value)
ToJsonObject(value) ==
  IF DOMAIN value = {} THEN
    "{}"
  ELSE
    ToJsonObjectString(value, DOMAIN value)
JsonSerialize(absoluteFilename, value) ==
  TRUE
JsonDeserialize(absoluteFilename) ==
  CHOOSE val : TRUE
ndJsonSerialize(absoluteFilename, value) ==
  TRUE
ndJsonDeserialize(absoluteFilename) ==
  CHOOSE val : TRUE
=============================================================================
`,
  ],
  [
    "Randomization",
    `-------------------------- MODULE Randomization------------------------------
LOCAL INSTANCE Naturals
LOCAL INSTANCE FiniteSets
RandomSubset(k, S) == CHOOSE T \\in SUBSET S : Cardinality(T) = k
RandomSetOfSubsets(k, n, S) == CHOOSE T \\in SUBSET SUBSET S :
                                              Cardinality(T) \\leq k
TestRandomSetOfSubsets(k, n, S) ==
              [i \\in 1..5 |-> Cardinality(RandomSetOfSubsets(k, n, S))]
=============================================================================
`,
  ],
  [
    "Reals",
    `-------------------------------- MODULE Reals -------------------------------
EXTENDS Integers
Real  == "Reals"
a / b == CHOOSE m \\in Real : m * b = a
Infinity == CHOOSE i : (i \\notin Real) /\\ (\\A r \\in Real : i > r)
=============================================================================
`,
  ],
  [
    "RealTime",
    `----------------------------- MODULE RealTime -------------------------------
EXTENDS Reals
VARIABLE now
RTBound(A, v, D, E) ==
  LET TNext(t)  ==  t' = IF <<A>>_v \\/ ~(ENABLED <<A>>_v)'
                           THEN 0
                           ELSE t + (now'-now)
      Timer(t) == (t=0)  /\\  [][TNext(t)]_<<t, v, now>>
      MaxTime(t) == [](t \\leq E)
      MinTime(t) == [][A => t \\geq D]_v
  IN \\EE t : Timer(t) /\\ MaxTime(t) /\\ MinTime(t)
-----------------------------------------------------------------------------
RTnow(v) == LET NowNext == /\\ now' \\in {r \\in Real : r > now}
                           /\\ UNCHANGED v
            IN  /\\ now \\in Real
                /\\ [][NowNext]_now
                /\\ \\A r \\in Real : WF_now(NowNext /\\ (now'>r))
=============================================================================
`,
  ],
  [
    "Toolbox",
    `----------------------------- MODULE Toolbox --------------------------------
LOCAL INSTANCE Naturals
LOCAL INSTANCE FiniteSets
LOCAL INSTANCE TLC
-----------------------------------------------------------------------------
_TETrace ==
    CHOOSE f \\in [ (Nat \\ {0}) -> STRING ] : TRUE
LOCAL _TETraceLength == Cardinality(DOMAIN _TETrace)
_TEPosition ==
    IF TLCGet("level") >= _TETraceLength
       THEN _TETraceLength
       ELSE IF TLCGet("level") = 0 THEN 1 ELSE TLCGet("level")
=============================================================================
`,
  ],
  [
    "_Possible",
    `------------------------------ MODULE _Possible ------------------------------
LOCAL INSTANCE TLC
LOCAL INSTANCE TLCExt
LOCAL INSTANCE Naturals
LOCAL INSTANCE Sequences
LOCAL _Update(Op(_,_), val) ==
    TLCSet("s:_possible", Op(TLCGetOrDefault("s:_possible", <<>>), val))
_Track(expr, name) ==
    _Update(LAMBDA old, b:
        IF b
        THEN
            IF name \\in DOMAIN old
            THEN [old EXCEPT ![name] = @ + 1]
            ELSE old @@ (name :> 1)
        ELSE old @@ (name :> 0), expr)
LOCAL _Merge(a, b) ==
    [name \\in (DOMAIN a) \\cup (DOMAIN b) |->
        (IF name \\in DOMAIN a THEN a[name] ELSE 0) +
        (IF name \\in DOMAIN b THEN b[name] ELSE 0)]
_Counts ==
    LET workers == TLCGet("all:named")["s:_possible"]
        n == Len(workers)
        Fold[i \\in 0..n] ==
            IF i = 0 THEN <<>>
            ELSE _Merge(Fold[i-1], workers[i])
    IN Fold[n]
_CheckName(name) ==
    LET counts == _Counts
    IN (name \\notin DOMAIN counts \\/ counts[name] = 0)
       => (PrintT(counts) /\\ FALSE)
_PrintCounts == PrintT(_Counts)
=============================================================================
`,
  ],
]);
