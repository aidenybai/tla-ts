(* Exports the Isabelle/TLA+ object logic that tlapm's theories see, as JSON: the theorems, the
   simpset, the claset and the context rules, each in the order of Isabelle's own nets. *)
val out_path = the (OS.Process.getEnv "ISABELLE_LOGIC_OUT");

val thy = @{theory};
val ctxt = Proof_Context.init_global thy;

fun jint i = if i < 0 then "-" ^ Int.toString (~ i) else Int.toString i;
fun esc s =
  let
    fun e c =
      if c = "\"" then "\\\"" else if c = "\\" then "\\\\"
      else if c = "\n" then "\\n" else c;
  in "\"" ^ String.concat (map e (Symbol.explode s)) ^ "\"" end;

(* types, interned *)
val type_tab : (typ * int) list Unsynchronized.ref = Unsynchronized.ref [];
val type_out : string list Unsynchronized.ref = Unsynchronized.ref [];
fun sort_json S = "[" ^ commas (map esc S) ^ "]";
fun typ_id T =
  (case AList.lookup (op =) (! type_tab) T of
    SOME i => i
  | NONE =>
      let
        val s =
          (case T of
            Type (a, Ts) => "[\"T\"," ^ esc a ^ ",[" ^ commas (map (jint o typ_id) Ts) ^ "]]"
          | TFree (a, S) => "[\"F\"," ^ esc a ^ "," ^ sort_json S ^ "]"
          | TVar ((a, i), S) => "[\"V\"," ^ esc a ^ "," ^ jint i ^ "," ^ sort_json S ^ "]");
        val i = length (! type_out);
      in type_out := ! type_out @ [s]; type_tab := (T, i) :: ! type_tab; i end);

fun term_json (Const (a, T)) = "[\"C\"," ^ esc a ^ "," ^ jint (typ_id T) ^ "]"
  | term_json (Free (a, T)) = "[\"F\"," ^ esc a ^ "," ^ jint (typ_id T) ^ "]"
  | term_json (Var ((a, i), T)) =
      "[\"V\"," ^ esc a ^ "," ^ jint i ^ "," ^ jint (typ_id T) ^ "]"
  | term_json (Bound i) = "[\"B\"," ^ jint i ^ "]"
  | term_json (Abs (a, T, t)) =
      "[\"A\"," ^ esc a ^ "," ^ jint (typ_id T) ^ "," ^ term_json t ^ "]"
  | term_json (t $ u) = "[\"$\"," ^ term_json t ^ "," ^ term_json u ^ "]";

(* theorems, interned by full proposition (with names) *)
val thm_tab : (term * int) list Unsynchronized.ref = Unsynchronized.ref [];
val thm_out : string list Unsynchronized.ref = Unsynchronized.ref [];
fun thm_id th =
  let
    val _ = if null (Thm.hyps_of th) andalso null (Thm.tpairs_of th) then ()
      else error ("theorem with hyps or tpairs: " ^ Thm.string_of_thm ctxt th);
    val prop = Thm.prop_of th;
  in
    (case find_first (fn (t, _) => t = prop) (! thm_tab) of
      SOME (_, i) => i
    | NONE =>
        let val i = length (! thm_out)
        in thm_out := ! thm_out @ [term_json prop]; thm_tab := (prop, i) :: ! thm_tab; i end)
  end;

fun my_keys t =
  let
    fun add (t, cs) =
      let fun rands (f $ t, cs) = "$" :: rands (f, add (t, cs))
            | rands (Const (c, _), cs) = c :: cs
            | rands (Free (c, _), cs) = c :: cs
            | rands (Bound i, cs) = Name.bound i :: cs
      in case head_of t of Var _ => "?" :: cs | Abs _ => "?" :: cs | _ => rands (t, cs) end
  in add (t, []) end;
fun key_json ks = esc (space_implode " " ks);

fun name_json (a, i) = "[" ^ esc a ^ "," ^ jint i ^ "]";

(* constants *)
val {constants, ...} = Consts.dest (Sign.consts_of thy);
val consts_json = "[" ^ commas (map (fn (c, (T, rhs)) =>
  "[" ^ esc c ^ "," ^ jint (typ_id T) ^
  (case rhs of NONE => "" | SOME t => "," ^ term_json t) ^ "]") constants) ^ "]";

(* facts *)
val facts = Facts.dest_static true [] (Global_Theory.facts_of thy);
val facts_json = "[" ^ commas (map (fn (a, ths) =>
  "[" ^ esc a ^ ",[" ^ commas (map (jint o thm_id) ths) ^ "]]") facts) ^ "]";

(* simpset *)
val ss = simpset_of ctxt;
val {simps, simprocs, congs, weak_congs, loopers, unsafe_solvers, safe_solvers, ...} =
  Raw_Simplifier.dest_ss ss;
fun elhs_of th =
  Envir.eta_contract (#1 (Logic.dest_equals (Logic.strip_imp_concl (Thm.prop_of th))));
val simps_json = "[" ^ commas (map (fn (name, th) =>
  "[" ^ name_json name ^ "," ^ jint (thm_id th) ^ "," ^
    key_json (my_keys (elhs_of th)) ^ "]") simps) ^ "]";
val congs_json = "[" ^ commas (map (fn ((b, a), th) =>
  "[" ^ (if b then "true" else "false") ^ "," ^ esc a ^ "," ^ jint (thm_id th) ^ "]") congs) ^ "]";
val weak_json = "[" ^ commas (map (fn (b, a) =>
  "[" ^ (if b then "true" else "false") ^ "," ^ esc a ^ "]") weak_congs) ^ "]";
val simprocs_json = "[" ^ commas (map (fn (a, lhss) =>
  "[" ^ esc a ^ ",[" ^ commas (map term_json lhss) ^ "]]") simprocs) ^ "]";
fun strings_json xs = "[" ^ commas (map esc xs) ^ "]";

(* claset *)
val cs = Classical.rep_cs (Classical.claset_of ctxt);
fun brl_key (eres, th) =
  if eres then my_keys (Thm.major_prem_of th) else my_keys (Thm.concl_of th);
fun netpair_json (inet, enet) =
  let
    fun item (k, (eres, th)) =
      "[" ^ jint k ^ "," ^ (if eres then "true" else "false") ^ "," ^
        jint (thm_id th) ^ "," ^ key_json (brl_key (eres, th)) ^ "]";
  in "[[" ^ commas (map item (Net.content inet)) ^ "],[" ^ commas (map item (Net.content enet)) ^ "]]" end;
fun ctx_netpair_json (inet, enet) =
  let
    fun item ((w, k), (eres, th)) =
      "[" ^ jint w ^ "," ^ jint k ^ "," ^ (if eres then "true" else "false") ^ "," ^
        jint (thm_id th) ^ "," ^ key_json (brl_key (eres, th)) ^ "]";
  in "[[" ^ commas (map item (Net.content inet)) ^ "],[" ^ commas (map item (Net.content enet)) ^ "]]" end;
fun rules_json rules = "[" ^ commas (map (fn (th, (th1, ths1), (th2, ths2)) =>
  "[" ^ jint (thm_id th) ^ "," ^ jint (thm_id th1) ^ ",[" ^
    commas (map (jint o thm_id) ths1) ^ "]," ^ jint (thm_id th2) ^ ",[" ^
    commas (map (jint o thm_id) ths2) ^ "]]") (Item_Net.content rules)) ^ "]";
val claset_json =
  "{\"safeIs\":" ^ rules_json (#safeIs cs) ^
  ",\"safeEs\":" ^ rules_json (#safeEs cs) ^
  ",\"unsafeIs\":" ^ rules_json (#unsafeIs cs) ^
  ",\"unsafeEs\":" ^ rules_json (#unsafeEs cs) ^
  ",\"swrappers\":" ^ strings_json (map #1 (#swrappers cs)) ^
  ",\"uwrappers\":" ^ strings_json (map #1 (#uwrappers cs)) ^
  ",\"safe0\":" ^ netpair_json (#safe0_netpair cs) ^
  ",\"safep\":" ^ netpair_json (#safep_netpair cs) ^
  ",\"unsafe\":" ^ netpair_json (#unsafe_netpair cs) ^
  ",\"dup\":" ^ netpair_json (#dup_netpair cs) ^
  ",\"extra\":" ^ ctx_netpair_json (#extra_netpair cs) ^ "}";

val context_rules_json =
  "{\"bang\":" ^ ctx_netpair_json (Context_Rules.netpair_bang ctxt) ^
  ",\"plain\":" ^ ctx_netpair_json (Context_Rules.netpair ctxt) ^ "}";

val json =
  "{\"types\":[" ^ commas (! type_out) ^ "]" ^
  ",\"consts\":" ^ consts_json ^
  ",\"facts\":" ^ facts_json ^
  ",\"simps\":" ^ simps_json ^
  ",\"congs\":" ^ congs_json ^
  ",\"weakCongs\":" ^ weak_json ^
  ",\"simprocs\":" ^ simprocs_json ^
  ",\"loopers\":" ^ strings_json loopers ^
  ",\"unsafeSolvers\":" ^ strings_json unsafe_solvers ^
  ",\"safeSolvers\":" ^ strings_json safe_solvers ^
  ",\"claset\":" ^ claset_json ^
  ",\"contextRules\":" ^ context_rules_json ^
  ",\"thms\":[" ^ commas (! thm_out) ^ "]}";

val _ = File.write (Path.explode out_path) json;
val _ = writeln ("wrote " ^ jint (size json));
