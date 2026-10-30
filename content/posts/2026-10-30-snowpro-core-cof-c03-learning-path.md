---
date: 2026-10-30T02:38:11Z
draft: false
title: "SnowPro Core (COF-C03): A Condensed Learning Path"
categories:
  - technology
tags:
  - "claude-code"
  - snowflake
  - certification
  - study guide
  - data engineering
---

This is a compact study plan for Snowflake's **SnowPro Core** certification, exam code **COF-C03**. The plan follows the exam's five domains. Each topic links to the Snowflake documentation page that covers it, so you study from current docs instead of old blog posts. Every number in the "must know" lists was checked against those pages in October 2026.

> **Unofficial guide.** Snowflake's exam study guide is free, but you have to fill in a form on the [certification page](https://learn.snowflake.com/en/certifications/snowpro-core-c03/) to get it. The domain list below comes from third-party summaries of that guide, which agree with each other.[^oep][^devto][^bdp] Download the official guide and check the objectives against it before you book.

## The exam at a glance

| | |
| :- | :- |
| Exam code | COF-C03 (replaced COF-C02) |
| Format | 100 multiple-choice and multiple-select questions[^devto] |
| Time | 115 minutes[^devto][^oep] |
| Passing score | 750 out of 1000, scaled[^devto][^oep] |
| Price | US$175 per attempt[^official] |
| Recommended experience | 6+ months of using Snowflake[^official] |
| Timeline | COF-C03 launched 16 February 2026; the English COF-C02 retired 14 May 2026[^devto][^oep] |

Snowflake's own summary says the exam tests whether you can use the AI Data Cloud architecture, manage accounts and warehouses, load, unload and transform data, work with structured, semi-structured and unstructured data, monitor and optimise performance, enable collaboration and protection, and set up connectivity.[^official]

## The five domains

| # | Domain | Weight |
| :- | :- | -: |
| 1 | Snowflake AI Data Cloud Features and Architecture | **31%** |
| 4 | Performance Optimization, Querying, and Transformation | 21% |
| 2 | Account Management and Data Governance | 20% |
| 3 | Data Loading, Unloading, and Connectivity | 18% |
| 5 | Data Collaboration | 10% |

These weights come from several third-party summaries of the official guide, which all agree.[^oep][^devto][^bdp] Domain 1 is almost a third of the exam, so spend about a third of your time on it. Older study material, including some "SnowPro notes" still online, uses COF-C02's **six** domains (24/18/18/16/12/12). Don't plan your time around those numbers.

## The learning path

The path is four phases of roughly 8 to 10 hours each. The phases are ordered so each one builds on the last: architecture first, then moving data in, then securing and paying for it, then making it fast and sharing it. The hours are my own suggestion, not Snowflake's. Do every phase in a [free trial account](https://signup.snowflake.com/), because the exam expects hands-on experience.

1. **Phase 1: The platform** (Domain 1, 31%)
2. **Phase 2: Getting data in and out** (Domain 3, plus objective 4.4 on transformation)
3. **Phase 3: Securing and paying for it** (Domain 2)
4. **Phase 4: Speed and sharing** (Domains 4 and 5, then practice exams)

---

## Phase 1: The platform (Domain 1, 31%)

**Objectives:** architecture layers and editions (1.1), interfaces (1.2), the object hierarchy and parameter precedence (1.3), virtual warehouses (1.4), storage concepts (1.5), and AI/ML and app development features (1.6).[^oep]

**Read:**
- [Key concepts and architecture](https://docs.snowflake.com/en/user-guide/intro-key-concepts): the three layers are **database storage**, **query processing** (virtual warehouses), and **cloud services**.
- [Snowflake editions](https://docs.snowflake.com/en/user-guide/intro-editions): learn the feature matrix. The exam likes to ask which edition a feature first appears in.
- [Overview of warehouses](https://docs.snowflake.com/en/user-guide/warehouses-overview), [multi-cluster warehouses](https://docs.snowflake.com/en/user-guide/warehouses-multicluster), [Gen2 warehouses](https://docs.snowflake.com/en/user-guide/warehouses-gen2), [Snowpark-optimized warehouses](https://docs.snowflake.com/en/user-guide/warehouses-snowpark-optimized).
- [Micro-partitions and data clustering](https://docs.snowflake.com/en/user-guide/tables-clustering-micropartitions), [temporary and transient tables](https://docs.snowflake.com/en/user-guide/tables-temp-transient), [Apache Iceberg tables](https://docs.snowflake.com/en/user-guide/tables-iceberg).
- [Parameters](https://docs.snowflake.com/en/sql-reference/parameters): account, session and object parameters, and how a lower level overrides a higher one.
- [Cortex AI Functions](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql), [Streamlit in Snowflake](https://docs.snowflake.com/en/developer-guide/streamlit/about-streamlit), [Snowflake Notebooks](https://docs.snowflake.com/en/user-guide/ui-snowsight/notebooks).

**Must know:**
- **Which edition each feature needs.** Standard Edition includes 1-day Time Travel, Fail-safe, dynamic tables, Iceberg tables, and database replication. **Enterprise** adds Time Travel of up to 90 days, multi-cluster warehouses, materialized views, search optimization, query acceleration, masking and row access policies. **Business Critical** adds Tri-Secret Secure, private connectivity (PrivateLink), HIPAA/HITRUST support, and account **failover/failback**.[^editions]
- **Billing:** warehouses bill per second, with a 60-second minimum each time they start. Auto-suspend is on by default.[^wh]
- **Multi-cluster warehouses** run in *maximized* mode (minimum clusters = maximum) or *auto-scale* mode (maximum > minimum). The **Standard** scaling policy (the default) starts clusters to avoid queuing. **Economy** keeps the running clusters busy and accepts some queuing to save credits.[^mcw]
- **Gen2** is the next generation of standard warehouses. New standard warehouses default to `GENERATION = '2'` where it's available, but Gen2 doesn't come in 5X-Large or 6X-Large. **Snowpark-optimized** warehouses give you more memory on a single node, for jobs like ML training.[^gen2][^spo]
- **Micro-partitions** hold 50 to 500 MB of *uncompressed* data each, stored by column. They're created automatically, and they're what lets Snowflake skip data a query doesn't need (pruning).[^mp]
- **Table types:** temporary tables last for the session. Temporary and transient tables get 0 or 1 day of Time Travel and **no Fail-safe**. Permanent tables get 7 days of Fail-safe.[^tt]
- **Iceberg tables** store Parquet files in an *external volume* you manage, and use either Snowflake or an external catalog.[^ice]
- **Cortex AI SQL functions** worth recognising: `AI_COMPLETE`, `AI_CLASSIFY`, `AI_FILTER`, `AI_AGG`, `AI_EXTRACT`, `AI_SENTIMENT`, `AI_SUMMARIZE_AGG` and `AI_TRANSLATE`.[^cortex]

**Recent changes:** the original Notebooks are now called **Legacy Notebooks**. Their replacement is **Notebooks in Workspaces**, which is compatible with Jupyter.[^nb] There's also a newer **Adaptive Compute** option (Enterprise Edition and up, in some regions) that sizes and routes compute automatically.[^adaptive] I haven't confirmed whether the exam covers either one. Know they exist, and spend most of your time on standard warehouses.

**Lab:** in a trial account, create an X-Small warehouse and change its size. Turn it into a multi-cluster warehouse with each scaling policy. Create a permanent, a transient and a temporary table, then run `SHOW TABLES` and compare the `retention_time` column.

---

## Phase 2: Getting data in and out (Domain 3, 18%, plus 4.4)

**Objectives:** loading and unloading (3.1), automated ingestion (3.2), connectors and integrations (3.3), and transformations on structured, semi-structured and unstructured data (4.4).[^oep]

**Read:**
- [Overview of data loading](https://docs.snowflake.com/en/user-guide/data-load-overview), [preparing your data files](https://docs.snowflake.com/en/user-guide/data-load-considerations-prepare), [loading considerations](https://docs.snowflake.com/en/user-guide/data-load-considerations-load), [unloading](https://docs.snowflake.com/en/user-guide/data-unload-overview).
- [Snowpipe](https://docs.snowflake.com/en/user-guide/data-load-snowpipe-intro), [streams](https://docs.snowflake.com/en/user-guide/streams-intro), [tasks](https://docs.snowflake.com/en/user-guide/tasks-intro), [dynamic tables](https://docs.snowflake.com/en/user-guide/dynamic-tables/overview).
- [Querying semi-structured data](https://docs.snowflake.com/en/user-guide/querying-semistructured) and [FLATTEN](https://docs.snowflake.com/en/sql-reference/functions/flatten).

**Must know:**
- **Stages:** each user has a **user stage** and each table has a **table stage**, and neither can be altered or dropped. A table stage only loads into its own table. **Named** internal and external stages are schema objects with their own privileges. `PUT` uploads files to an internal stage, and `GET` downloads unloaded files from one.[^load][^unload]
- **File sizing:** aim for files of about **100 to 250 MB compressed**. How many files load in parallel depends on the warehouse size.[^prep]
- **Load metadata:** `COPY INTO` remembers which files it has loaded for **64 days**, so it won't load the same file twice. A Snowpipe pipe remembers for **14 days**, and truncating the target table doesn't reset that.[^loadc][^pipe]
- **Unloading:** `COPY INTO <location>` writes multiple files by default (`SINGLE = FALSE`).[^unload]
- **Snowpipe** is a pipe (one `COPY INTO` statement) that runs on serverless compute. It's triggered by cloud event notifications (`AUTO_INGEST = TRUE`) or the REST API. **Snowpipe Streaming** loads rows rather than files.[^pipe]
- **Streams** store an *offset* and no table data. Know the three types: standard, append-only and insert-only.[^streams]
- **Tasks** run on a schedule or when an event happens, on serverless or user-managed compute. You can chain them into **task graphs**.[^tasks]
- **Dynamic tables** are declarative: you write a `SELECT` and a `TARGET_LAG`, and Snowflake refreshes the table, incrementally or in full, in dependency order.[^dt]
- **Openflow** appears in objective 3.2, but the study guide reportedly says it won't be tested until it's generally available everywhere.[^oep]

**Lab:** stage a JSON file, load it into a `VARIANT` column, flatten it with `LATERAL FLATTEN`, and then rebuild the same pipeline as a dynamic table.

---

## Phase 3: Securing and paying for it (Domain 2, 20%)

**Objectives:** the security model (2.1), governance features (2.2), and monitoring and cost management (2.3).[^oep]

**Read:**
- [Access control overview](https://docs.snowflake.com/en/user-guide/security-access-control-overview), [MFA](https://docs.snowflake.com/en/user-guide/security-mfa), [network policies](https://docs.snowflake.com/en/user-guide/network-policies).
- [Dynamic Data Masking](https://docs.snowflake.com/en/user-guide/security-column-ddm-intro), [row access policies](https://docs.snowflake.com/en/user-guide/security-row-intro), [object tagging](https://docs.snowflake.com/en/user-guide/object-tagging/introduction), [Trust Center](https://docs.snowflake.com/en/user-guide/trust-center/overview).
- [Resource monitors](https://docs.snowflake.com/en/user-guide/resource-monitors), [Account Usage](https://docs.snowflake.com/en/sql-reference/account-usage).

**Must know:**
- **Access control models:** in **DAC**, every object has an owner, who can grant access to it. In **RBAC**, privileges go to roles and roles go to users. **UBAC** grants privileges to users directly.[^ac]
- **System roles:** ACCOUNTADMIN includes SYSADMIN and SECURITYADMIN. SECURITYADMIN inherits USERADMIN and has MANAGE GRANTS. **ORGADMIN is being phased out** in favour of **GLOBALORGADMIN**, which older material won't mention.[^ac]
- **MFA** is for human users who sign in with a password. Service users need another way to authenticate. Snowflake is moving to require MFA for all password sign-ins.[^mfa]
- **Masking and row access policies** are schema-level objects and need Enterprise Edition. Masking happens at query time.[^ddm][^rap]
- **Tags** are key-value pairs. Child objects inherit them, and they can be set to propagate automatically.[^tags]
- **Trust Center** checks an account against *scanners* and reports *findings*.[^trust]
- **Resource monitors** only cover warehouses, not serverless features. Only **ACCOUNTADMIN** can create one. A monitor's credit quota counts cloud services usage too.[^rm]
- **ACCOUNT_USAGE vs INFORMATION_SCHEMA:** ACCOUNT_USAGE includes dropped objects, lags by **45 minutes to 3 hours**, and keeps data for **1 year**. INFORMATION_SCHEMA has no lag, but only keeps **7 days to 6 months**.[^au]

**Lab:** build a small role hierarchy under SYSADMIN, then add a masking policy that shows full email addresses to one role only. Set a resource monitor on your warehouse with a low quota and watch it trigger.

---

## Phase 4: Speed and sharing (Domains 4 and 5, 31% together)

**Objectives:** evaluating and optimising query performance (4.1 and 4.2) and caching (4.3).[^oep] Then replication, failover, cloning and Time Travel (5.1), sharing models (5.2), and Marketplace, listings and Native Apps (5.3).[^oep]

**Read:**
- [Query Profile in Snowsight](https://docs.snowflake.com/en/user-guide/ui-snowsight-activity), [query insights](https://docs.snowflake.com/en/user-guide/query-insights).
- [Query Acceleration Service](https://docs.snowflake.com/en/user-guide/query-acceleration-service), [search optimization](https://docs.snowflake.com/en/user-guide/search-optimization-service), [clustering keys](https://docs.snowflake.com/en/user-guide/tables-clustering-keys), [materialized views](https://docs.snowflake.com/en/user-guide/views-materialized), [persisted query results](https://docs.snowflake.com/en/user-guide/querying-persisted-results).
- [Time Travel](https://docs.snowflake.com/en/user-guide/data-time-travel), [Fail-safe](https://docs.snowflake.com/en/user-guide/data-failsafe), [cloning](https://docs.snowflake.com/en/user-guide/object-clone), [replication and failover](https://docs.snowflake.com/en/user-guide/account-replication-intro).
- [Secure Data Sharing](https://docs.snowflake.com/en/user-guide/data-sharing-intro), [reader accounts](https://docs.snowflake.com/en/user-guide/data-sharing-reader-create), [listings](https://docs.snowflake.com/en/collaboration/collaboration-listings-about), [Snowflake Marketplace](https://docs.snowflake.com/en/collaboration/collaboration-marketplace-about), [Native App Framework](https://docs.snowflake.com/en/developer-guide/native-apps/native-apps-about), [Data Clean Rooms](https://docs.snowflake.com/en/user-guide/cleanrooms/introduction).

**Must know (performance):**
- **Query Profile signs to recognise:** bytes spilled to *local* or *remote* storage (the warehouse ran out of memory, so try a bigger size), poor pruning (partitions scanned compared with the total), and the most expensive nodes.[^qp]
- **Which tool for which problem:** **QAS** offloads the heavy parts of *outlier* queries to shared serverless compute. **Search optimization** speeds up *selective point lookups*. **Clustering keys** are for *very large* tables where the natural data order is poor. **Materialized views** query a **single table** only and are kept up to date in the background.[^qas][^sos][^ck][^mv]
- **Caches:** the **result cache** keeps a query's result for 24 hours, and each reuse resets the clock, up to **31 days** in total. A reuse only happens if the underlying data hasn't changed and the role has access.[^rc] Objective 4.3 also names the *metadata* cache and the *warehouse* (local disk) cache.[^oep]

**Must know (protection and sharing):**
- **Time Travel** keeps 1 day by default. Permanent objects can be set to anything from 0 to 90 days, but values above 1 day need Enterprise Edition. After Time Travel comes **Fail-safe**: 7 days that you can't configure, where only **Snowflake Support** can recover data.[^ttp][^fs]
- **Cloning** copies the structure but not the data. A cloned database or schema keeps the grants on its child objects, but not the grants on the container itself. Internal named stages are only cloned with `INCLUDE INTERNAL STAGES`.[^clone]
- **Replication:** replication groups produce read-only secondaries. **Failover groups** can be promoted to primary, and failover needs **Business Critical**.[^repl]
- **Sharing:** shared objects are **read-only** and no data is copied. Consumers only pay for the compute they use. A **reader account** is created and paid for by the provider, for consumers who don't have a Snowflake account.[^share][^reader]

**Lab:** run the same query twice and watch the second run come back from the result cache. Drop a table and `UNDROP` it. Clone a schema and check which grants came with it. Share a secure view with a reader account.

---

## A last word on practice

Snowflake University's free **Hands-On Essentials** badges cover the practical side.[^official] Stay away from "exam dump" sites. They aren't official, and they're often written for the old exam anyway. If you finish the four labs above and can explain each "must know" item without notes, you're ready for practice exams.

## References

Most links below go to Snowflake's documentation and certification pages. Entries marked *(Unofficial)* are third-party summaries of the exam guide, so check them against the official guide.

[^official]: Snowflake, "SnowPro Core Certification (COF-C03)," *Snowflake University*. <https://learn.snowflake.com/en/certifications/snowpro-core-c03/>
[^editions]: Snowflake Docs, "Snowflake editions." <https://docs.snowflake.com/en/user-guide/intro-editions>
[^wh]: Snowflake Docs, "Overview of warehouses." <https://docs.snowflake.com/en/user-guide/warehouses-overview>
[^mcw]: Snowflake Docs, "Multi-cluster warehouses." <https://docs.snowflake.com/en/user-guide/warehouses-multicluster>
[^gen2]: Snowflake Docs, "Snowflake generation 2 standard warehouses." <https://docs.snowflake.com/en/user-guide/warehouses-gen2>
[^spo]: Snowflake Docs, "Snowpark-optimized warehouses." <https://docs.snowflake.com/en/user-guide/warehouses-snowpark-optimized>
[^adaptive]: Snowflake Docs, "Adaptive Compute." <https://docs.snowflake.com/en/user-guide/warehouses-adaptive>
[^mp]: Snowflake Docs, "Micro-partitions & Data Clustering." <https://docs.snowflake.com/en/user-guide/tables-clustering-micropartitions>
[^tt]: Snowflake Docs, "Working with Temporary and Transient Tables." <https://docs.snowflake.com/en/user-guide/tables-temp-transient>
[^ice]: Snowflake Docs, "Apache Iceberg tables." <https://docs.snowflake.com/en/user-guide/tables-iceberg>
[^cortex]: Snowflake Docs, "Snowflake Cortex AI Functions." <https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql>
[^nb]: Snowflake Docs, "About Legacy Snowflake Notebooks." <https://docs.snowflake.com/en/user-guide/ui-snowsight/notebooks>
[^load]: Snowflake Docs, "Overview of data loading." <https://docs.snowflake.com/en/user-guide/data-load-overview>
[^prep]: Snowflake Docs, "Preparing your data files." <https://docs.snowflake.com/en/user-guide/data-load-considerations-prepare>
[^loadc]: Snowflake Docs, "Loading considerations: load metadata." <https://docs.snowflake.com/en/user-guide/data-load-considerations-load>
[^unload]: Snowflake Docs, "Overview of data unloading." <https://docs.snowflake.com/en/user-guide/data-unload-overview>
[^pipe]: Snowflake Docs, "Snowpipe." <https://docs.snowflake.com/en/user-guide/data-load-snowpipe-intro>
[^streams]: Snowflake Docs, "Introduction to streams." <https://docs.snowflake.com/en/user-guide/streams-intro>
[^tasks]: Snowflake Docs, "Introduction to tasks." <https://docs.snowflake.com/en/user-guide/tasks-intro>
[^dt]: Snowflake Docs, "Dynamic tables." <https://docs.snowflake.com/en/user-guide/dynamic-tables/overview>
[^ac]: Snowflake Docs, "Overview of access control." <https://docs.snowflake.com/en/user-guide/security-access-control-overview>
[^mfa]: Snowflake Docs, "Multi-factor authentication (MFA)." <https://docs.snowflake.com/en/user-guide/security-mfa>
[^ddm]: Snowflake Docs, "Understanding Dynamic Data Masking." <https://docs.snowflake.com/en/user-guide/security-column-ddm-intro>
[^rap]: Snowflake Docs, "Understanding row access policies." <https://docs.snowflake.com/en/user-guide/security-row-intro>
[^tags]: Snowflake Docs, "Introduction to object tagging." <https://docs.snowflake.com/en/user-guide/object-tagging/introduction>
[^trust]: Snowflake Docs, "Trust Center." <https://docs.snowflake.com/en/user-guide/trust-center/overview>
[^rm]: Snowflake Docs, "Working with resource monitors." <https://docs.snowflake.com/en/user-guide/resource-monitors>
[^au]: Snowflake Docs, "Account Usage." <https://docs.snowflake.com/en/sql-reference/account-usage>
[^qp]: Snowflake Docs, "Monitor query activity with Query History (Query Profile)." <https://docs.snowflake.com/en/user-guide/ui-snowsight-activity>
[^qas]: Snowflake Docs, "Using the Query Acceleration Service." <https://docs.snowflake.com/en/user-guide/query-acceleration-service>
[^sos]: Snowflake Docs, "Search optimization service." <https://docs.snowflake.com/en/user-guide/search-optimization-service>
[^ck]: Snowflake Docs, "Clustering Keys & Clustered Tables." <https://docs.snowflake.com/en/user-guide/tables-clustering-keys>
[^mv]: Snowflake Docs, "Working with Materialized Views." <https://docs.snowflake.com/en/user-guide/views-materialized>
[^rc]: Snowflake Docs, "Using persisted query results." <https://docs.snowflake.com/en/user-guide/querying-persisted-results>
[^ttp]: Snowflake Docs, "Understanding & using Time Travel." <https://docs.snowflake.com/en/user-guide/data-time-travel>
[^fs]: Snowflake Docs, "Understanding and viewing Fail-safe." <https://docs.snowflake.com/en/user-guide/data-failsafe>
[^clone]: Snowflake Docs, "Cloning considerations." <https://docs.snowflake.com/en/user-guide/object-clone>
[^repl]: Snowflake Docs, "Introduction to replication and failover across multiple accounts." <https://docs.snowflake.com/en/user-guide/account-replication-intro>
[^share]: Snowflake Docs, "About Secure Data Sharing." <https://docs.snowflake.com/en/user-guide/data-sharing-intro>
[^reader]: Snowflake Docs, "Manage reader accounts." <https://docs.snowflake.com/en/user-guide/data-sharing-reader-create>
[^oep]: (Unofficial) Open Exam Prep, "SnowPro Core Exam Guide 2026 (COF-C03)." It cites the official study guide, last updated 8 July 2026. <https://open-exam-prep.com/blog/snowpro-core-certification-exam-guide-2026>
[^devto]: (Unofficial) S. PS, "SnowPro Core COF-C03 vs COF-C02: What Changed," *DEV Community*, 2026. <https://dev.to/sajeevsebastian/snowpro-core-cof-c03-vs-cof-c02-what-changed-49le>
[^bdp]: (Unofficial) BigDataPrep, "Snowflake SnowPro Core COF-C03 Certification Study Guide," 21 July 2026. <https://www.bigdataprep.com/2026/07/21/snowflake-snowpro-core-cof-c03-certification-study-guide/>
